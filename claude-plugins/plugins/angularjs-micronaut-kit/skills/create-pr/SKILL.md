---
name: create-pr
description: Prepare a pull request for the current branch - check the branch, run the review-code skill and the checks for both halves (av-ui/ and av-service/), write the PR title and description including endpoint and accessibility notes, and print the push and gh commands for the user to run. It never pushes. Use this when the user asks to create, open or prepare a pull request.
argument-hint: "[base branch, default main]"
disable-model-invocation: true
---

# Prepare a pull request (draft only)

`git push` is denied for Claude and `gh` is not allowed, so this skill **prepares** the PR and the user publishes it. Do not try another way to push.

## 1. Check the branch
- Base: the argument, or `main`. If the current branch is the base, stop and offer `git checkout -b <type>/<short-name>`.
- The working tree must be clean. If not, offer the `angularjs-micronaut-kit:commit` skill first.
- `git log --oneline <base>..HEAD` and `git diff --stat <base>...HEAD`. If there are no commits, stop.

## 2. Review first
- Run the `angularjs-micronaut-kit:review-code` skill on `<base>...HEAD`.
- Any **critical** or **high** finding stops here: report them and do not write the PR.

## 3. Run the checks
For each half the branch touches:
- `av-service/`: `./mvnw clean verify` (all tests, including containers). If Docker is not available for the container tests, say so in the test plan rather than claiming a pass.
- `av-ui/`: `npm run lint && npm test && npm run build`.

Record each result for the test plan. A failure stops here.

## 4. Write the description
Write it to a file **outside the repository** (the session scratchpad if there is one, otherwise the system temp folder), named `pr-<branch>.md`:

```markdown
## Summary
What changed and why, in 2-4 bullet points, in plain English.

## Acceptance criteria
Sprint and ACs covered, with the test commit and implementation commit for each (from `implementation-status.json` if present).

## Endpoints
Endpoints added, changed or removed (method, path, request/response, status codes, error shape), and the frontend services and mock responses updated to match.

## Accessibility
Screens touched, axe results, keyboard and focus behaviour checked, anything not verified.

## Data
Migrations added (additive, ordered); configuration or Secrets the environments need (names only, never values).

## Test plan
The exact commands run and their results.

## Open questions
Items in `docs/open-questions.md` this touches or depends on.

## Merge
Squash merge: the `test(...)` commits fail on purpose.
```

Title: one imperative sentence under 72 characters. Add the attribution footer if the session requires one.

## 5. Hand over
Print the title, the file path and these commands for the user to run:

```bash
git push -u origin <branch>
gh pr create --base <base> --title "<title>" --body-file "<path>"
```
