---
name: commit
description: Stage the right files, run the fast checks and commit in this repository's message style, letting the pre-commit lint hook run. Use this when the user asks to commit their changes.
argument-hint: "[optional message or sprint/AC hint]"
disable-model-invocation: true
---

# Commit (backend)

Relevant rules: `.claude/rules/tdd.md`. Never use `--no-verify` or `-n`, never change `core.hooksPath`, and never switch Snyk off or add ignores.

## 1. Check what will be committed
- Run `git status` and `git diff --cached`. Refuse to commit on `main`; offer `git checkout -b <type>/<short-name>` instead.
- If nothing is staged, propose a list of files and stage them only after the user agrees. One logical change per commit.
- Never stage `.env*`, keys, keystores (`*.jks`, `*.p12`, `*.pem`), `target/`, `logs/`, or `application*.yml` changes that contain real hosts, DNs or credentials.

## 2. Run the fast checks
- `./mvnw -q test` (unit and slice tests, no containers).
- **Except** for a `test(sprint-NN): ACn failing tests` commit, which fails on purpose. For that commit, run only the new tests (`./mvnw -q test -Dtest='<Class>' -Dsurefire.failIfNoSpecifiedTests=false`) and confirm they fail on an assertion, not a compile error.
- If a check fails, fix the cause, not the check. If you cannot fix it, stop and report.

## 3. Write the message
- During a sprint, follow `tdd.md`: `test(sprint-NN): ACn failing tests`, `feat(sprint-NN): <feature> - implement ACn`, `refactor(sprint-NN): ...`.
- Rule or guidance changes: `docs(rules): ...`. Tooling: `chore: ...`.
- Otherwise match recent history (`git log --oneline -10`): one imperative sentence in sentence case, under 72 characters. Add a body only to explain why.
- If the change alters the API contract, say so in the body and mark it **breaking** if the frontend must change.
- No personal data, ticket contents, hostnames or environment names in the message.

## 4. Commit
- Run `bash .githooks/pre-commit` on the staged files first. This works whether or not the Git hooks are turned on; never run `git config` to check or change them (the protect-files hook refuses it).
- `git commit`, passing the message with a heredoc so it is not mangled.
- If the pre-commit hook fails: fix what it reports, `git add` again, and make a **new** commit attempt (do not amend someone else's commit).
- If the commit output shows no lint hook running, remind the user of the once-per-clone hook set-up in `CLAUDE.md` ("Commands"); do not run it yourself.
- If Snyk blocks the commit, report the issue and stop.

## 5. Report
The commit hash and message, the checks run and their results, and anything left unstaged.
