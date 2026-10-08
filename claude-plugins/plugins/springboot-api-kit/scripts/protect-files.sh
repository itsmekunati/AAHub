#!/usr/bin/env bash
# Claude Code PreToolUse hook: protects secrets, critical files, tests, sprint files and real environments.
# Registered by this plugin's hooks/hooks.json for Read, Grep, Glob, Edit, Write, MultiEdit, NotebookEdit and Bash.
# Tiers (see the marketplace README):
#   1 never read      2 never edit      3 ask first      4 free to edit
# It also checks what is being written (secrets, disabled tests) and which agent is writing (sprint files).
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

has() { printf '%s' "$1" | grep -Eq -- "$2"; }
has_i() { printf '%s' "$1" | grep -Eiq -- "$2"; }

# ---------- read the hook input once ----------
# Prints shell assignments for the fields this script uses, each value safely quoted.
#   new_text: the text a write or edit would add      old_text: the text an edit would replace
load_fields() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$input" | jq -r '
      def s: if type == "string" then . else "" end;
      (.tool_input // {}) as $t
      | ($t.edits | if type == "array" then . else [] end) as $e
      | @sh "tool=\(.tool_name | s)",
        @sh "file_path=\(($t.file_path | s) as $f | if $f != "" then $f else ($t.notebook_path | s) end)",
        @sh "search_path=\($t.path | s)",
        @sh "cmd=\($t.command | s)",
        @sh "agent_type=\(.agent_type | s)",
        @sh "new_text=\([$t.content, $t.new_string, $t.new_source] + [$e[] | .new_string?] | map(s) | join("\n"))",
        @sh "old_text=\([$t.old_string] + [$e[] | .old_string?] | map(s) | join("\n"))"'
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$input" | python3 -c 'import json, shlex, sys
d = json.loads(sys.stdin.buffer.read().decode("utf-8", "replace"))
t = d.get("tool_input") if isinstance(d.get("tool_input"), dict) else {}
e = [x for x in t.get("edits", []) if isinstance(x, dict)] if isinstance(t.get("edits"), list) else []
s = lambda v: v if isinstance(v, str) else ""
out = {
    "tool": s(d.get("tool_name")),
    "file_path": s(t.get("file_path")) or s(t.get("notebook_path")),
    "search_path": s(t.get("path")),
    "cmd": s(t.get("command")),
    "agent_type": s(d.get("agent_type")),
    "new_text": "\n".join(s(v) for v in [t.get("content"), t.get("new_string"), t.get("new_source")] + [x.get("new_string") for x in e]),
    "old_text": "\n".join(s(v) for v in [t.get("old_string")] + [x.get("old_string") for x in e]),
}
sys.stdout.buffer.write("".join(k + "=" + shlex.quote(v) + "\n" for k, v in out.items()).encode("utf-8"))'
  else
    return 1
  fi
}

tool=""; file_path=""; search_path=""; cmd=""; agent_type=""; new_text=""; old_text=""
fields=$(load_fields) || decide deny "protect-files.sh needs jq (or python3) to check tool calls. Ask a person to install jq."
eval "$fields"

# ---------- path helpers ----------
# On Windows, tool paths arrive as C:\dir\file while the repo root and $HOME use other forms,
# so compare everything with forward slashes and without regard to case.
ROOT_N="${ROOT//\\//}"
HOME_N=$(cygpath -m "$HOME" 2>/dev/null || printf '%s' "$HOME")

rel() { # path relative to the repo root (absolute paths outside the repo are returned unchanged)
  local p="$1"
  p="${p/#\~/$HOME}"
  p="${p//\\//}"
  shopt -s nocasematch
  case "$p" in
    "$ROOT_N"/*) p="${p:$(( ${#ROOT_N} + 1 ))}" ;;
    "$HOME_N"/*) p="$HOME/${p:$(( ${#HOME_N} + 1 ))}" ;;
    ./*) p="${p#./}" ;;
  esac
  shopt -u nocasematch
  printf '%s' "$p"
}

in_repo() { # a path already passed through rel(): true if it is inside the repository
  case "$1" in /*|[A-Za-z]:/*|"~"*|"") return 1 ;; esac
  return 0
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

is_test_file() {
  if [ "$REPO_KIND" = "backend" ]; then
    case "$1" in src/test/*|*/src/test/*|*Test.java|*Tests.java|*IT.java) return 0 ;; esac
  else
    case "$1" in *.test.*|*.spec.*|src/test/*|*/src/test/*|e2e/*|*/e2e/*) return 0 ;; esac
  fi
  return 1
}

# ---------- what is being written ----------
# Markers that switch a test off or narrow a run to one test.
if [ "$REPO_KIND" = "backend" ]; then
  test_markers='@Disabled|@Ignore([^[:alnum:]_]|$)'
  test_paths='src/test/|Tests?\.java|IT\.java'
else
  test_markers='\.(skip|only|todo|fixme)[[:space:]]*\(|(^|[^[:alnum:]_.])(xit|xdescribe|xtest|fit|fdescribe)[[:space:]]*\('
  test_paths='\.(test|spec)\.[cm]?[jt]sx?|src/test/|e2e/'
fi

secret_kind() { # prints the kind of secret new_text certainly contains, if any
  if   has "$new_text" '-----BEGIN ([A-Z0-9]+ )*PRIVATE KEY-----'; then printf 'private key'
  elif has "$new_text" '(^|[^A-Z0-9])(AKIA|ASIA)[0-9A-Z]{16}([^A-Z0-9]|$)'; then printf 'AWS access key'
  elif has "$new_text" 'gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,}'; then printf 'GitHub token'
  elif has "$new_text" 'xox[baprs]-[A-Za-z0-9-]{10,}'; then printf 'Slack token'
  fi
}

possible_secret_kind() { # prints the kind of secret new_text may contain, if any (can be a false alarm)
  local q="[\"']"
  if   has "$new_text" "[a-zA-Z][a-zA-Z0-9+.-]*://[^/[:space:]:@\"']+:[^/[:space:]@\"'\$<{]{3,}@"; then printf 'address with a user name and password in it'
  elif has "$new_text" 'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'; then printf 'signed token (JWT)'
  elif has_i "$new_text" "(password|passwd|pwd|secret|api[_-]?key|access[_-]?key|token)${q}?[[:space:]]*[:=][[:space:]]*${q}[^\"'\$<{[:space:]]{8,}${q}"; then printf 'password, key or token written as a literal value'
  fi
}

adds_test_marker() { # $1=path as given by the tool: true if this write adds a marker that was not there before
  has "$new_text" "$test_markers" || return 1
  if [ -n "$old_text" ]; then
    has "$old_text" "$test_markers" && return 1
  else
    local on_disk="${1//\\//}"
    [ -f "$on_disk" ] && grep -Eq -- "$test_markers" "$on_disk" 2>/dev/null && return 1
  fi
  return 0
}

# ---------- which agent is writing ----------
agent_role=""
case "$agent_type" in
  *generator) agent_role="generator" ;;
  *evaluator) agent_role="evaluator" ;;
  *planner)   agent_role="planner" ;;
esac

check_agent_role() { # $1=path relative to the repo root
  local p="$1"
  in_repo "$p" || return 0
  case "$agent_role" in
    generator)
      case "$p" in sprints/*/evaluation-*.json|sprints/*/contract.json|sprints/*/blocked.json|sprints/status.json|specs/product-spec.json)
        decide deny "The Generator does not write $p. Contracts, status and the spec belong to the Planner; evaluations belong to the Evaluator." ;;
      esac ;;
    evaluator)
      case "$p" in sprints/sprint-*/evaluation-*.json) ;; *)
        decide deny "The Evaluator may only write its own sprints/sprint-NN/evaluation-RR.json (and temporary files outside the repository), not $p. Report the problem as a bug instead of changing the file." ;;
      esac ;;
    planner)
      case "$p" in src/*|e2e/*)
        decide deny "The Planner does not edit product code or tests ($p). Delegate the change to the Generator." ;;
      esac ;;
  esac
}

# ---------- file tools ----------
case "$tool" in
  Read|Grep|Glob)
    for p in "$file_path" "$search_path"; do
      [ -n "$p" ] || continue
      p=$(rel "$p")
      is_secret "$p" && decide deny "Protected (never read): $p holds secrets. Ask a person for the non-secret information you need."
      is_ask_read "$p" && decide ask "Log files can contain personal data: confirm reading $p."
    done
    exit 0 ;;
  Edit|Write|MultiEdit|NotebookEdit)
    [ -n "$file_path" ] || exit 0
    p=$(rel "$file_path")
    is_secret "$p" && decide deny "Protected (never read or edit): $p holds secrets."
    is_merged_migration "$p" && decide deny "Protected: $p is a merged migration. Add a new versioned migration instead."
    is_never_edit "$p" && decide deny "Protected (never edit): $p. A person must make this change. Stop and report what is needed."
    check_agent_role "$p"
    if [ -n "$new_text" ]; then
      kind=$(secret_kind)
      [ -n "$kind" ] && decide deny "Blocked: the text being written to $p looks like it contains a secret ($kind). Never write a real secret to a file; read it from an environment variable or a Secret, or use an obviously fake placeholder."
      if is_test_file "$p"; then
        adds_test_marker "$file_path" && decide ask "This change disables, skips or narrows a test in $p. Tests must not be switched off to make a build pass: confirm only if a person has agreed to it."
      else
        case "$p" in src/mocks/*|*/src/mocks/*) ;; *)
          kind=$(possible_secret_kind)
          [ -n "$kind" ] && decide ask "The text being written to $p may contain a secret ($kind). Confirm it is not a real secret, or replace it with configuration." ;;
        esac
      fi
    fi
    is_ask_edit "$p" && decide ask "Ask first: $p is configuration or project guidance. Confirm this change."
    exit 0 ;;
  Bash) ;;
  *) exit 0 ;;
esac

# ---------- shell commands ----------
[ -n "$cmd" ] || exit 0
bare=$(printf '%s' "$cmd" | sed -E "s/\"[^\"]*\"//g; s/'[^']*'//g")   # without quoted text (e.g. commit messages)
start='(^|[;&|(]|&&|\|\|)[[:space:]]*'                                 # start of a command in a pipeline or chain

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
if has "$bare" "${start}(git[[:space:]]+rm|rm)[[:space:]]" && has "$cmd" "$test_paths"; then
  decide ask "This command deletes a test. Tests must not be removed to make a build pass: confirm only if a person has agreed to it."
fi
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
