---
name: review-code
description: Read-only review of a frontend diff, branch or commit range - applies the Evaluator's code-level checks and the rule files for the areas touched, without running the app, and grades findings with the sprint-rubric severity guide. Use this whenever someone asks for a review of a branch, diff or commit range, and before opening a pull request.
argument-hint: "[commit range, default main...HEAD]"
---

# Review a frontend change

Read-only: change no files. The checks live elsewhere; this skill applies them to a diff. Generic bug-hunting is not repeated here; suggest the built-in `/code-review` for that at the end.

## 1. Collect the change
- Range: the argument if given, otherwise `main...HEAD`. Include uncommitted changes (`git diff` and `git diff --cached`) and say so.
- `git log --oneline <range>` and `git diff --stat <range>`, then read the full diff.
- List `.claude/rules/` and read every rule whose area the diff touches (for example `design-system.md` and `forms-accessibility.md` for `src/components/` and `src/pages/`, `api-client.md` and `auth.md` for `src/services/`).

## 2. Check
- **The Evaluator's code-level checks:** from "What to check" in `.claude/agents/evaluator.md`, apply **Design System**, **Security**, **Code**, **Protected files** and **Scope** as far as the diff shows them, and from **TDD discipline** the git-log order and "none deleted, skipped or weakened". The TDD order applies only to commits that follow the sprint pattern (`test(sprint-NN)` / `feat(sprint-NN)`).
- **The rule files** read in step 1, for anything the Evaluator's list does not name.
- **Not here:** checks that need the app running or a build (Commands, Behaviour, Roles and session in the browser, browser accessibility, mocks in the bundle). Point to the `a11y-audit` and `release-ready` skills, or the Evaluator during a sprint.

## 3. Report
- Grade each finding with the severity guide in the `sprint-rubric` skill.
- One line per finding: `severity` - `path:line` - what is wrong - which rule or check it breaks - the fix.
- Order by severity (critical, high, medium, low). Say which areas you checked and found nothing.
- End with the verdict: **blocking** if anything is critical or high, otherwise **ok to raise a PR**. Suggest `/code-review` for a general bug pass.
