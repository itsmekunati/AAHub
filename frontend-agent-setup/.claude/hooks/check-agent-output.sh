#!/usr/bin/env bash
# Claude Code SubagentStop hook: a sprint agent may not finish without the file the Planner reads next.
#   Generator: sprints/sprint-NN/self-eval.json (or a recorded needs-decision / contract-mismatch).
#   Evaluator: sprints/sprint-NN/evaluation-RR.json with generatedBy "evaluator" and a PASS or FAIL verdict.
# It blocks once: if the agent has already been sent back (stop_hook_active), it is allowed to finish.
# Outside a sprint in progress (no sprints/status.json, or the build is not in progress) it does nothing.
# Registered in .claude/settings.json. Needs no jq or python3.
# Change this file only in a reviewed pull request; agents are not allowed to edit it.

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
input=$(cat)

has() { printf '%s' "$1" | grep -Eq -- "$2"; }
block() { # $1=reason
  printf '{"decision":"block","reason":"%s"}\n' "${1//\"/\'}"
  exit 0
}

has "$input" '"stop_hook_active"[[:space:]]*:[[:space:]]*true' && exit 0

agent_type=$(printf '%s' "$input" | grep -Eo '"agent_type"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n 1 | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/')
case "$agent_type" in
  *generator) role="generator" ;;
  *evaluator) role="evaluator" ;;
  *) exit 0 ;;
esac

status_file="$ROOT/sprints/status.json"
[ -f "$status_file" ] || exit 0
status=$(cat "$status_file")
has "$status" '"buildStatus"[[:space:]]*:[[:space:]]*"in-progress"' || exit 0

n=$(printf '%s' "$status" | grep -Eo '"currentSprint"[[:space:]]*:[[:space:]]*"?[0-9]+' | head -n 1 | grep -Eo '[0-9]+$')
[ -n "$n" ] || exit 0
sprint=$(printf '%02d' "$((10#$n))")
dir="sprints/sprint-$sprint"
[ -d "$ROOT/$dir" ] || exit 0

if [ "$role" = "generator" ]; then
  [ -f "$ROOT/$dir/self-eval.json" ] && exit 0
  tracker="$ROOT/$dir/implementation-status.json"
  [ -f "$tracker" ] && grep -Eq '"status"[[:space:]]*:[[:space:]]*"(needs-decision|contract-mismatch)"' "$tracker" && exit 0
  block "Sprint $sprint has no $dir/self-eval.json. Write it before finishing, or record needs-decision in $dir/implementation-status.json and report NEEDS-DECISION. If the build cannot be made to work, say so in your report starting FAILED-TO-BUILD."
fi

latest=$(ls "$ROOT/$dir"/evaluation-*.json 2>/dev/null | sort | tail -n 1)
[ -n "$latest" ] || block "Sprint $sprint has no $dir/evaluation-RR.json. Write the evaluation file with a PASS or FAIL verdict before finishing."
name="${latest##*/}"
grep -Eq '"generatedBy"[[:space:]]*:[[:space:]]*"evaluator"' "$latest" \
  || block "$dir/$name does not have generatedBy set to evaluator. Finish the evaluation file before returning."
grep -Eq '"verdict"[[:space:]]*:[[:space:]]*"(PASS|FAIL)"' "$latest" \
  || block "$dir/$name has no final verdict. Set verdict to PASS or FAIL (use FAIL with a bug describing the blocker if you could not run the checks) before returning."

exit 0
