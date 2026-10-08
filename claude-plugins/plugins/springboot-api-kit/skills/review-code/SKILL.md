---
name: review-code
description: Read-only review of a backend diff, branch or commit range - applies the Evaluator's code-level checks and the rule files for the packages touched, runs the api-contract-diff skill when the API may change, and grades findings with the sprint-rubric severity guide. Use this whenever someone asks for a review of a branch, diff or commit range, and before opening a pull request.
argument-hint: "[commit range, default main...HEAD]"
---

# Review a backend change

Read-only: change no files. The checks live elsewhere; this skill applies them to a diff. Generic bug-hunting is not repeated here; suggest the built-in `/code-review` (and `/security-review` for security-heavy changes) at the end.

## 1. Collect the change
- Range: the argument if given, otherwise `main...HEAD`. Include uncommitted changes (`git diff` and `git diff --cached`) and say so.
- `git log --oneline <range>` and `git diff --stat <range>`, then read the full diff.
- List `.claude/rules/` and read every rule whose `paths:` match a file the diff touches (for example `api-contract.md` for `api/`, `persistence.md` for the persistence package, and the project's security and audit rules where it has them).

## 2. Check
- **The Evaluator's code-level checks:** from "What to check" in `${CLAUDE_PLUGIN_ROOT}/agents/evaluator.md`, apply **Code**, **TDD discipline** (the git-log order and "none deleted, disabled or weakened"), **Protected files** and **Scope**, and **Authorisation**, **Input**, **Failure paths** and **Audit output** as far as the diff and its tests show them. The TDD order applies only to commits that follow the sprint pattern (`test(sprint-NN)` / `feat(sprint-NN)`).
- **The rule files** read in step 1, for anything the Evaluator's list does not name.
- **API contract:** if the diff touches `api/`, `exception/` or DTOs, run the `springboot-api-kit:api-contract-diff` skill against the base of the range. If it cannot run (no build yet), compare the DTOs, status codes, error shape and validation by reading the diff.
- **Not here:** checks that need the running service (Build, Runtime probing). Point to the `springboot-api-kit:release-ready` skill, or the Evaluator during a sprint.

## 3. Report
- Grade each finding with the severity guide in the `springboot-api-kit:sprint-rubric` skill.
- One line per finding: `severity` - `path:line` - what is wrong - which rule or check it breaks - the fix.
- Order by severity (critical, high, medium, low). Say which areas you checked and found nothing.
- List breaking API changes separately, even if intended.
- End with the verdict: **blocking** if anything is critical or high, otherwise **ok to raise a PR**. Suggest `/code-review` for a general bug pass.
