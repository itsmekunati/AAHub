#!/usr/bin/env bash
# Claude Code PreToolUse hook: protects secrets, critical files and real environments.
# Registered in .claude/settings.json for Read, Grep, Glob, Edit, Write, MultiEdit, NotebookEdit and Bash.
# Tiers (see docs/AGENT-WORKFLOW-GUIDE.md, Step 5.3):
#   1 never read      2 never edit      3 ask first      4 free to edit
# Decisions are returned as JSON (permissionDecision "deny" or "ask"); anything else is left to the normal rules.
# Requires jq (or python3 as a fallback). Without either, it blocks the call and says so.
# Change this file only in a reviewed pull request; agents are not allowed to edit it.

REPO_KIND="backend"   # backend | frontend
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"

input=$(cat)

decide() { # $1=deny|ask  $2=reason
  local reason=${2//\"/\'}
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"%s","permissionDecisionReason":"%s"}}\n' "$1" "$reason"
  exit 0
}

field() { # extract a string field from the hook input
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$input" | jq -r "$1 // empty"
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$input" | python3 -c 'import json,sys
d=json.load(sys.stdin); v=d
for k in sys.argv[1].lstrip(".").split("."):
    v=v.get(k) if isinstance(v,dict) else None
print(v if isinstance(v,str) else "")' "$1"
  else
    decide deny "protect-files.sh needs jq (or python3) to check tool calls. Ask a person to install jq."
  fi
}

tool=$(field '.tool_name')

# ---------- path helpers ----------
rel() { # path relative to the repo root (absolute paths outside the repo are returned unchanged)
  local p="$1"
  p="${p/#\~/$HOME}"
  case "$p" in
    "$ROOT"/*) p="${p#"$ROOT"/}" ;;
    ./*) p="${p#./}" ;;
  esac
  printf '%s' "$p"
}

is_secret() { # tier 1: never read (and never edit)
  local p="$1" b="${1##*/}"
  case "$b" in
    .env.example|*.env.example) return 1 ;;
    .env|.env.*|*.pem|*.key|*.p12|*.pfx|*.jks|*.keystore|id_rsa*|id_ed25519*|id_ecdsa*|.npmrc|.netrc|.pgpass) return 0 ;;
    *storageState*.json) return 0 ;;
  esac
  case "$p" in
    "$HOME"/.ssh/*|"$HOME"/.aws/*|"$HOME"/.kube/*|"$HOME"/.docker/config.json|"$HOME"/.m2/settings.xml|"$HOME"/.config/gcloud/*|"$HOME"/.config/configstore/snyk.json) return 0 ;;
    e2e/.auth/*|*/e2e/.auth/*|playwright/.auth/*|.auth/*) return 0 ;;
  esac
  return 1
}

is_merged_migration() {
  local p="$1"
  [ "$REPO_KIND" = "backend" ] || return 1
  case "$p" in src/main/resources/db/migration/*) ;; *) return 1 ;; esac
  git -C "$ROOT" cat-file -e "origin/main:$p" 2>/dev/null || git -C "$ROOT" cat-file -e "main:$p" 2>/dev/null
}

is_never_edit() { # tier 2
  local p="$1"
  case "$p" in
    .claude/settings.json|.claude/settings.local.json|.claude/hooks/*|.githooks/*|.git/*|.github/workflows/*|deploy/*) return 0 ;;
  esac
  if [ "$REPO_KIND" = "backend" ]; then
    case "$p" in mvnw|mvnw.cmd|.mvn/wrapper/*) return 0 ;; esac
    is_merged_migration "$p" && return 0
  else
    case "$p" in openapi/*|src/services/api/generated/*|package-lock.json) return 0 ;; esac
  fi
  return 1
}

is_ask_edit() { # tier 3
  local p="$1"
  case "$p" in
    CLAUDE.md|.claude/rules/*|.claude/agents/*|.claude/skills/*|docs/*|Dockerfile|.gitignore) return 0 ;;
  esac
  if [ "$REPO_KIND" = "backend" ]; then
    case "$p" in pom.xml|src/main/resources/application*.yml|src/main/resources/application*.yaml|checkstyle*.xml|*/checkstyle*.xml) return 0 ;; esac
  else
    case "$p" in package.json|eslint.config.*|.eslintrc*|tsconfig*.json|vite.config.*|vitest.config.*|jest.config.*|playwright.config.*|.prettierrc*|prettier.config.*) return 0 ;; esac
  fi
  return 1
}

is_ask_read() {
  case "$1" in logs/*|*/logs/*|*.log) return 0 ;; esac
  return 1
}

# ---------- file tools ----------
case "$tool" in
  Read|Grep|Glob)
    for key in .tool_input.file_path .tool_input.path; do
      p=$(field "$key"); [ -n "$p" ] || continue
      p=$(rel "$p")
      is_secret "$p" && decide deny "Protected (never read): $p holds secrets. Ask a person for the non-secret information you need."
      is_ask_read "$p" && decide ask "Log files can contain personal data: confirm reading $p."
    done
    exit 0 ;;
  Edit|Write|MultiEdit|NotebookEdit)
    p=$(field '.tool_input.file_path'); [ -n "$p" ] || p=$(field '.tool_input.notebook_path')
    [ -n "$p" ] || exit 0
    p=$(rel "$p")
    is_secret "$p" && decide deny "Protected (never read or edit): $p holds secrets."
    is_merged_migration "$p" && decide deny "Protected: $p is a merged migration. Add a new versioned migration instead."
    is_never_edit "$p" && decide deny "Protected (never edit): $p. A person must make this change. Stop and report what is needed."
    is_ask_edit "$p" && decide ask "Ask first: $p is configuration or project guidance. Confirm this change."
    exit 0 ;;
  Bash) ;;
  *) exit 0 ;;
esac

# ---------- shell commands ----------
cmd=$(field '.tool_input.command')
[ -n "$cmd" ] || exit 0
bare=$(printf '%s' "$cmd" | sed -E "s/\"[^\"]*\"//g; s/'[^']*'//g")   # without quoted text (e.g. commit messages)
start='(^|[;&|(]|&&|\|\|)[[:space:]]*'                                 # start of a command in a pipeline or chain
has() { printf '%s' "$1" | grep -Eq -- "$2"; }

# Secrets: reading or printing them through the shell.
if has "$cmd" '(^|[^[:alnum:]_.-])\.env($|[^.[:alnum:]_-]|\.[[:alnum:]_-]+)' && ! has "$cmd" '\.env\.example'; then
  decide deny "Protected (never read): .env files hold secrets."
fi
has "$cmd" '\.(pem|key|p12|pfx|jks|keystore)([^[:alnum:]]|$)|id_(rsa|ed25519|ecdsa)|\.ssh/|\.aws/|\.kube/|\.docker/config\.json|\.m2/settings\.xml|\.npmrc|storageState|e2e/\.auth' \
  && decide deny "Protected (never read): the command touches credentials or keys."
has "$bare" "${start}(printenv|env)([[:space:]]|$)" && decide deny "Printing environment variables can expose secrets."
has "$cmd" 'configstore/snyk|SNYK_TOKEN' && decide deny "Protected (never read): the Snyk token."

# Snyk switches and account actions are for people only.
has "$bare" "(^|[[:space:];&|])SNYK=|${start}(export[[:space:]]+SNYK=)|git([[:space:]]+[^;&|]*)?[[:space:]]config[^;&|]*hooks\.snyk" \
  && decide deny "Only a person can turn Snyk checks on or off (SNYK=..., git config hooks.snyk...)."
has "$bare" "${start}snyk[[:space:]]+(auth|monitor|config|ignore|policy)([[:space:]]|$)" \
  && decide deny "Snyk sign-in, monitoring, configuration and ignores are done by a person."

# Bypassing checks.
has "$bare" '--no-verify|core\.hooksPath|LEFTHOOK=0' && decide deny "Git hooks must not be bypassed or changed. Fix what the check reports."
if has "$bare" "${start}git([[:space:]]+-[^[:space:]]+([[:space:]]+[^-[:space:]][^[:space:]]*)?)*[[:space:]]+commit([[:space:]]|$)" \
   && has "$bare" '(^|[[:space:]])-[a-zA-Z]*n[a-zA-Z]*([[:space:]]|$)'; then
  decide deny "'git commit -n' skips the Git hooks. Commit without it."
fi

# Publishing.
has "$bare" "${start}git([[:space:]]+-[^[:space:]]+([[:space:]]+[^-[:space:]][^[:space:]]*)?)*[[:space:]]+push([[:space:]]|$)" \
  && decide deny "Pushing is done by a person. Stop and report that the work is ready to push."
has "$bare" "${start}npm[[:space:]]+publish|${start}(\./)?mvnw?[[:space:]](.*[[:space:]])?deploy([[:space:]]|$)" \
  && decide deny "Publishing and deploying are done by people and CI."

# Real environments.
has "$bare" "${start}(oc|kubectl|helm|argocd|aws|az|gcloud)([[:space:]]|$)|${start}docker[[:space:]]+login" \
  && decide deny "Real environments are off limits (no oc, kubectl, helm, argocd or cloud CLIs). Work locally or with mocks."

# Network: only localhost.
if has "$bare" "${start}(curl|wget)([[:space:]]|$)"; then
  urls=$(printf '%s' "$cmd" | grep -Eo 'https?://[^[:space:]"'"'"']+' || true)
  for u in $urls; do
    case "$u" in http://localhost*|https://localhost*|http://127.0.0.1*|https://127.0.0.1*) ;; *)
      decide deny "Network calls from the shell are limited to localhost. Use the web fetch tool for documentation." ;;
    esac
  done
fi

# Destroying work.
has "$bare" "${start}git[[:space:]].*(reset[[:space:]]+--hard|clean[[:space:]]+-[a-zA-Z]*f|checkout[[:space:]]+--[[:space:]]+\.|restore[[:space:]]+(--staged[[:space:]]+)?\.([[:space:]]|$))" \
  && decide deny "This would discard work. Ask a person to do it if it is really needed."
if has "$bare" "${start}rm[[:space:]]+(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)"; then
  has "$bare" "${start}rm[[:space:]]+[^;&|]*[[:space:]]/tmp/" || decide ask "Recursive delete outside /tmp: confirm this command."
fi

# Writing to protected files through the shell (bypasses the Edit rules).
writes='(^|[[:space:]])(>|>>|tee|sed[[:space:]]+-i|perl[[:space:]]+-[a-zA-Z]*i|cp|mv|rm|truncate|chmod|ln|dd|git[[:space:]]+(checkout|restore|rm|mv))([[:space:]]|$)'
protected='(^|[[:space:]/])(\.claude/settings(\.local)?\.json|\.claude/hooks/|\.githooks/|\.git/|\.github/workflows/|deploy/'
if [ "$REPO_KIND" = "backend" ]; then
  protected="$protected|mvnw|\.mvn/wrapper/|src/main/resources/db/migration/)"
else
  protected="$protected|openapi/|src/services/api/generated/|package-lock\.json)"
fi
if has "$bare" "$writes" && has "$bare" "$protected"; then
  decide deny "Protected (never edit): this command changes a protected file. A person must make this change."
fi

exit 0
