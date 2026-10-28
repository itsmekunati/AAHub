---
name: review-code
description: Read-only review of a diff, branch or commit range across av-ui/ (AngularJS) and av-service/ (Micronaut) - applies the Evaluator's code-level checks and the rule files for the areas touched, checks the two halves still agree on every endpoint, and grades findings with the sprint-rubric severity guide. Use this whenever someone asks for a review of a branch, diff or commit range, and before opening a pull request.
argument-hint: "[commit range, default main...HEAD]"
---

# Review a change

Read-only: change no files. The checks live elsewhere; this skill applies them to a diff. Generic bug-hunting is not repeated here; suggest the built-in `/code-review` (and `/security-review` for security-heavy changes) at the end.

## 1. Collect the change
- Range: the argument if given, otherwise `main...HEAD`. Include uncommitted changes (`git diff` and `git diff --cached`) and say so.
- `git log --oneline <range>` and `git diff --stat <range>`, then read the full diff.
- List `.claude/rules/` and read every rule whose `paths:` match a file the diff touches (for example `backend-code-style.md` and `persistence.md` for `av-service/`, `forms-accessibility.md` and `frontend-code-style.md` for `av-ui/src/`, and the project's design system rule where it has one).

## 2. Check
- **The Evaluator's code-level checks:** from "What to check" in `${CLAUDE_PLUGIN_ROOT}/agents/evaluator.md`, apply **Design System**, **Security**, **Code**, **Protected files** and **Scope**, and **API behaviour** and **Failure paths** as far as the diff and its tests show them. From **TDD discipline**, apply the git-log order and "none deleted, disabled, skipped or weakened". The TDD order applies only to commits that follow the sprint pattern (`test(sprint-NN)` / `feat(sprint-NN)`).
- **Halves in step:** for every controller, DTO or status code the diff changes in `av-service/`, find the frontend services and mock responses that use it and confirm they changed to match. For every new `$http` call in `av-ui/`, confirm the endpoint exists in `av-service/` with the same path, method and fields.
- **The rule files** read in step 1, for anything the Evaluator's list does not name.
- **Not here:** checks that need the app running or a build (Commands, runtime probing, browser accessibility, mocks in the bundle). Point to the `angularjs-micronaut-kit:a11y-audit` and `angularjs-micronaut-kit:release-ready` skills, or the Evaluator during a sprint.

## 3. Report
- Grade each finding with the severity guide in the `angularjs-micronaut-kit:sprint-rubric` skill.
- One line per finding: `severity` - `path:line` - what is wrong - which rule or check it breaks - the fix.
- Order by severity (critical, high, medium, low). Say which areas you checked and found nothing.
- End with the verdict: **blocking** if anything is critical or high, otherwise **ok to raise a PR**. Suggest `/code-review` for a general bug pass.
