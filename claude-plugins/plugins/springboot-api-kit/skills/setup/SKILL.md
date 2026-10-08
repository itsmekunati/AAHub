---
name: setup
description: One-time set-up of a Spring Boot API repository for this plugin - copies the CLAUDE.md template, the rule files, the permission settings, the Git hooks, the open-questions list and any chosen optional packs into the repository, without overwriting anything. Use this when the user asks to set up or initialise the repository for the plugin, or to add a pack.
argument-hint: "[pack ...]  (okta, audit-s3)"
disable-model-invocation: true
---

# Set up this repository

A plugin can supply skills, agents and hooks, but not rules, `CLAUDE.md`, permission settings or Git hooks. This skill copies those into the repository, where the team then owns and edits them.

## 1. Choose the packs
Packs are optional rules and skills for one integration. Use the arguments if given; otherwise ask the user which apply:

| Pack | Adds | Choose it when |
|---|---|---|
| `okta` | rule `security-okta.md` | The API validates Okta tokens |
| `audit-s3` | rules `audit-logging.md`, `log-shipping.md`; skills `add-audit-event`, `log-shipping`; `docs/reference/audit-record-schema.md` | The API writes a structured audit log shipped to S3 |

## 2. Preview, then copy
Run the script from the repository root. Do not copy the files yourself with Edit or Write: the protect-files hook blocks edits to `.claude/settings.json` and `.githooks/`, and the script is the supported way to create them.

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/init.sh" --dry-run <packs>
```

Show the user the list. If they agree:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/init.sh" <packs>
```

The script never overwrites. A file that already exists and differs is left alone, and the template is written beside it as `<name>.template`.

## 3. Report
- What was written, what was already up to date, and what was left alone.
- For each file left alone, offer to show the difference from its `.template`. Merging is the user's decision; delete the `.template` afterwards. `.claude/settings.json` and `.githooks/` must be merged by a person.
- What the team must now fill in:
  - `CLAUDE.md`: every `SETUP` comment (what the application does, the systems it writes to, its own architectural rules).
  - `.claude/rules/`: the `SETUP` comments, and any rule that does not fit this application.
  - `docs/open-questions.md`: answer or delete the starter questions, and add the application's own.
- Once per clone, a person runs `git config core.hooksPath .githooks` to turn on the Git hooks. Do not run it yourself.
- The copied files now belong to this repository. A later plugin update does not change them; run this skill again to get fresh `.template` files to compare.
