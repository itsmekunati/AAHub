#!/usr/bin/env bash
# Claude Code SessionStart hook: tells the developer about missing set-up, and gives Claude the sprint state.
# Read-only: it looks at files and at the Git configuration, and changes nothing. Silent when there is nothing to say.
# Change this file only in a reviewed pull request.

PLUGIN="react-ui-kit"
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cat >/dev/null   # the hook input is not needed

warnings=""; context=""
warn() { warnings="${warnings:+$warnings | }$1"; }
note() { context="${context:+$context | }$1"; }

command -v jq >/dev/null 2>&1 || command -v python3 >/dev/null 2>&1 \
  || warn "$PLUGIN: neither jq nor python3 was found, so the protect-files hook will block every tool call. Install jq."

if [ ! -f "$ROOT/CLAUDE.md" ] || [ ! -d "$ROOT/.claude/rules" ]; then
  warn "$PLUGIN: this repository has not been set up for the plugin (no CLAUDE.md or .claude/rules). Run /$PLUGIN:setup."
fi

if [ -d "$ROOT/.githooks" ]; then
  hooks_path=$(git -C "$ROOT" config --get core.hooksPath 2>/dev/null)
  [ "$hooks_path" = ".githooks" ] || warn "$PLUGIN: the Git hooks are not turned on in this clone. Run: git config core.hooksPath .githooks"
fi

templates=$( { ls "$ROOT"/*.template 2>/dev/null; find "$ROOT/.claude" "$ROOT/.githooks" "$ROOT/docs" -maxdepth 4 -name '*.template' 2>/dev/null; } | wc -l | tr -d '[:space:]')
[ "${templates:-0}" -gt 0 ] && warn "$PLUGIN: $templates .template file(s) from setup are waiting to be merged or deleted."

status_file="$ROOT/sprints/status.json"
if [ -f "$status_file" ]; then
  build=$(grep -Eo '"buildStatus"[[:space:]]*:[[:space:]]*"[a-z-]+"' "$status_file" | head -n 1 | sed -E 's/.*"([a-z-]+)"$/\1/')
  current=$(grep -Eo '"currentSprint"[[:space:]]*:[[:space:]]*"?[0-9]+' "$status_file" | head -n 1 | grep -Eo '[0-9]+$')
  [ -n "$current" ] && note "Sprint loop: build status ${build:-unknown}, current sprint $current (see sprints/status.json)."
fi

questions_file="$ROOT/docs/open-questions.md"
if [ -f "$questions_file" ]; then
  open=$(grep -Ec '^\|[[:space:]]*[0-9]+[[:space:]]*\|' "$questions_file")
  [ "${open:-0}" -gt 0 ] && note "docs/open-questions.md has $open open question(s): ask rather than guess when a task depends on one."
fi

[ -n "$warnings$context" ] || exit 0

esc() { local s=${1//\\/\\\\}; printf '%s' "${s//\"/\\\"}"; }
out="{"
[ -n "$warnings" ] && out="$out\"systemMessage\":\"$(esc "$warnings")\""
if [ -n "$context" ]; then
  [ -n "$warnings" ] && out="$out,"
  out="$out\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$(esc "$context")\"}"
fi
printf '%s}\n' "$out"
