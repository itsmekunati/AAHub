#!/usr/bin/env bash
# Shared Snyk helpers for the Git hooks (sourced by pre-commit and pre-push).
# Settings, highest priority first:
#   1. One command only:  SNYK=1 git commit ...   or   SNYK=0 git commit ...   (master switch)
#   2. Personal (clone):  git config hooks.snyk true|false
#                         git config hooks.snyk.dependencies|iac|code true|false
#                         git config hooks.snyk.severity low|medium|high|critical
#                         git config hooks.snyk.whenUnavailable warn|block
#   3. Team default:      .githooks/snyk.conf (committed)

SNYK_LIB_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=/dev/null
. "$SNYK_LIB_DIR/snyk.conf"

_snyk_bool() {
  case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
    1|true|yes|on) echo true ;;
    *) echo false ;;
  esac
}

# Master switch and where it came from.
SNYK_SOURCE="team default"
_snyk_master="$SNYK_ENABLED"
if _v=$(git config --get hooks.snyk 2>/dev/null); then _snyk_master="$_v"; SNYK_SOURCE="your personal setting"; fi
if [ -n "${SNYK:-}" ]; then _snyk_master="$SNYK"; SNYK_SOURCE="SNYK=$SNYK for this command"; fi
SNYK_ON=$(_snyk_bool "$_snyk_master")

_snyk_setting() { # $1 = git key suffix, $2 = team default value
  local v
  if v=$(git config --get "hooks.snyk.$1" 2>/dev/null); then echo "$v"; else echo "$2"; fi
}
SNYK_SEV=$(_snyk_setting severity "$SNYK_SEVERITY")
SNYK_UNAVAILABLE=$(_snyk_setting whenUnavailable "$SNYK_WHEN_UNAVAILABLE")

snyk_check_on() { # $1 = dependencies | iac | code
  [ "$SNYK_ON" = true ] || return 1
  local def
  case "$1" in dependencies) def=$SNYK_DEPENDENCIES ;; iac) def=$SNYK_IAC ;; code) def=$SNYK_CODE ;; esac
  [ "$(_snyk_bool "$(_snyk_setting "$1" "$def")")" = true ]
}

_snyk_unavailable() { # $1 = label, $2 = reason
  if [ "$SNYK_UNAVAILABLE" = "block" ]; then
    echo "✖ Snyk $1: $2. Blocking because whenUnavailable is 'block'." >&2
    return 1
  fi
  echo "⚠ Snyk $1 skipped: $2. (CI still runs Snyk.)"
  return 0
}

snyk_run() { # $1 = label, then the snyk arguments
  local label="$1"; shift
  command -v snyk >/dev/null 2>&1 || { _snyk_unavailable "$label" "the Snyk CLI is not installed"; return $?; }
  echo "• Snyk $label (blocking at '$SNYK_SEV' and above)"
  snyk "$@" --severity-threshold="$SNYK_SEV"
  local rc=$?
  case $rc in
    0) return 0 ;;
    1) echo "✖ Snyk $label found issues at '$SNYK_SEV' or above. Fix them (e.g. upgrade the dependency), or agree a justified ignore in .snyk with a reason and expiry." >&2
       return 1 ;;
    3) echo "• Snyk $label: nothing supported to scan."; return 0 ;;
    *) _snyk_unavailable "$label" "Snyk could not run (not signed in, no network, or another error; exit code $rc)"; return $? ;;
  esac
}

snyk_off_note() {
  echo "• Snyk checks are off ($SNYK_SOURCE). To turn them on for yourself: git config hooks.snyk true"
}
