#!/usr/bin/env bash
# Copies this plugin's templates (CLAUDE.md, rules, permission settings, Git hooks, docs and any chosen
# packs) into the current repository. Run by the plugin's setup skill; can also be run by hand.
#
#   bash init.sh [--dry-run] [pack ...]
#
# It never overwrites. A file that already exists and differs is left alone, and the template is written
# beside it as <name>.template for a person to compare and merge.

set -u

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATES="$PLUGIN_ROOT/templates"
TARGET="${CLAUDE_PROJECT_DIR:-$(pwd)}"

dry_run=0
packs=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=1 ;;
    -*) echo "Unknown option: $arg" >&2; exit 2 ;;
    *) packs+=("$arg") ;;
  esac
done

available_packs() { [ -d "$TEMPLATES/packs" ] && ls "$TEMPLATES/packs" | tr '\n' ' '; }

for pack in ${packs[@]+"${packs[@]}"}; do
  if [ ! -d "$TEMPLATES/packs/$pack" ]; then
    echo "Unknown pack: $pack. Available: $(available_packs)" >&2
    exit 2
  fi
done

if [ ! -d "$TARGET/.git" ] && [ ! -f "$TARGET/.git" ]; then
  echo "Warning: $TARGET is not the root of a Git repository." >&2
fi

written=(); unchanged=(); skipped=()

copy_file() { # $1=source file  $2=destination path relative to the repository root
  local src="$1" rel="$2" dest="$TARGET/$2"
  if [ ! -e "$dest" ]; then
    written+=("$rel")
    [ "$dry_run" = 1 ] && return
    mkdir -p "$(dirname "$dest")" && cp "$src" "$dest"
  elif cmp -s "$src" "$dest"; then
    unchanged+=("$rel")
  else
    skipped+=("$rel")
    [ "$dry_run" = 1 ] && return
    cp "$src" "$dest.template"
  fi
}

copy_tree() { # $1=source directory  $2=destination directory relative to the repository root
  local src_dir="$1" dest_dir="$2" file
  [ -d "$src_dir" ] || return 0
  while IFS= read -r file; do
    copy_file "$file" "$dest_dir/${file#"$src_dir"/}"
  done < <(find "$src_dir" -type f | sort)
}

copy_file "$TEMPLATES/CLAUDE.md"     "CLAUDE.md"
copy_file "$TEMPLATES/settings.json" ".claude/settings.json"
copy_tree "$TEMPLATES/rules"         ".claude/rules"
copy_tree "$TEMPLATES/githooks"      ".githooks"
copy_tree "$TEMPLATES/docs"          "docs"

for pack in ${packs[@]+"${packs[@]}"}; do
  copy_tree "$TEMPLATES/packs/$pack/rules"  ".claude/rules"
  copy_tree "$TEMPLATES/packs/$pack/skills" ".claude/skills"
  copy_tree "$TEMPLATES/packs/$pack/docs"   "docs"
done

[ "$dry_run" = 1 ] || chmod +x "$TARGET"/.githooks/* 2>/dev/null

[ "$dry_run" = 1 ] && echo "Dry run: nothing was changed."
echo "Repository: $TARGET"
echo "Packs: ${packs[*]:-none} (available: $(available_packs))"
echo
echo "Written (${#written[@]}):"
for f in ${written[@]+"${written[@]}"}; do echo "  $f"; done
echo "Already up to date (${#unchanged[@]}):"
for f in ${unchanged[@]+"${unchanged[@]}"}; do echo "  $f"; done
echo "Left alone because they already exist; compare with <name>.template (${#skipped[@]}):"
for f in ${skipped[@]+"${skipped[@]}"}; do echo "  $f"; done
