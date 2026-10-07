---
name: fix-bug
description: Test-first procedure for fixing a bug in the React UI - restate it, reproduce it against the mock API, write a failing test that reproduces it and commit it, make the smallest fix, then look for the same bug elsewhere. Use this whenever you fix a reported bug, an evaluation bug or an accessibility failure, even a one-line fix.
argument-hint: "<bug description, or evaluation file and bug id>"
---

# Fix a bug (test-first)

Relevant rules: `.claude/rules/tdd.md` plus the rules for the area the bug is in. Follow the `tdd-cycle` skill; its "On a retry" section covers evaluation bugs.

## 1. Understand
- Restate the bug as **expected** vs **actual**, with the page, persona and scenario.
- Find the code (Grep for the text, label or route) and read the rule files for that area.
- If the expected behaviour is unclear or depends on an open question in `docs/open-questions.md`, stop and ask.

## 2. Reproduce
- Run `npm run dev` (mock API) and open the page; pick the scenario with `?scenario=<name>` on the first load (names are in `src/mocks/scenarios.ts`).
- If no scenario produces the bug, add one in a test, not in the shared mocks, unless it is a real outcome the UI must handle.
- If you cannot reproduce it, stop and report what you tried.

## 3. Red: a failing test that reproduces it
- At the lowest level that shows the bug: service test, component test, or page test with `renderApp({ scenario, route })`.
- For accessibility bugs, assert on focus, labels, roles or axe.
- Run it and confirm it fails **because of the bug**, not a broken set-up.
- Commit: during a sprint `test(sprint-NN): reproduce <bug>`; otherwise a sentence such as "Reproduce <bug> in a failing test".

## 4. Green: the smallest fix
- Change only what the bug needs. Never weaken another test, the lint configuration or an accessibility check.
- `npm run typecheck && npm run lint && npm test`.
- Commit: during a sprint `fix(sprint-NN): <feature> - resolve <bug>`; otherwise "Fix <bug>".

## 5. Look for the same bug elsewhere
Search for the same pattern (same component, same handling, same copy-pasted code). Report each place; fix them in separate commits only if the user agrees.

## 6. Report
Root cause, the test that proves the fix, the commit hashes, other places found, and anything not verified.
