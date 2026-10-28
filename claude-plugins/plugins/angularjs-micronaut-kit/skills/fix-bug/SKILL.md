---
name: fix-bug
description: Test-first procedure for fixing a bug in the AngularJS UI or the Micronaut API - restate it, reproduce it at the fastest test level, write a failing test that reproduces it and commit it, make the smallest fix with validation and accessibility intact, then look for the same bug elsewhere. Use this whenever you fix a reported bug, an evaluation bug or an accessibility failure, even a one-line fix.
argument-hint: "<bug description, or evaluation file and bug id>"
---

# Fix a bug (test-first)

Relevant rules: `.claude/rules/tdd.md` plus the rules for the area the bug is in. Follow the `angularjs-micronaut-kit:tdd-cycle` skill; its "On a retry" section covers evaluation bugs. Never reproduce against a real database or other real environment.

## 1. Understand
- Restate the bug as **expected** vs **actual**, with the page or endpoint, the input and the scenario.
- Decide which half it is in. A wrong value on screen can be a backend bug: check the API response before changing the UI.
- Find the code (Grep for the text, label, route or path) and read the rule files for that area.
- If the expected behaviour is unclear or depends on an open question in `docs/open-questions.md`, stop and ask.

## 2. Reproduce
- **Backend:** choose the fastest test level that shows it: unit (JUnit 5 + Mockito) for service and domain logic; HTTP (`@MicronautTest` + `HttpClient`) for endpoints, validation and status codes; integration (Testcontainers / Test Resources) for gateways, migrations and multi-system flows, using `Outages` for infrastructure failures.
- **Frontend:** run the UI against the mock backend and open the page with the scenario (see the `angularjs-micronaut-kit:ui-test-infrastructure` skill for how scenarios are chosen). If no scenario produces the bug, add one in a test, not in the shared mocks, unless it is a real outcome the UI must handle.
- If you cannot reproduce it, stop and report what you tried.

## 3. Red: a failing test that reproduces it
- At the lowest level that shows the bug. Name it after the bug (`@DisplayName("reproduces: blank reference is accepted")`, `it('reproduces: error summary is not focused', ...)`).
- For accessibility bugs, assert on focus, labels, roles or axe.
- Run it and confirm it fails **because of the bug**, not a compile error or a broken set-up.
- Commit: during a sprint `test(sprint-NN): reproduce <bug>`; otherwise a sentence such as "Reproduce <bug> in a failing test".

## 4. Green: the smallest fix
- Change only what the bug needs. Never weaken another test, validation, the lint configuration or an accessibility check.
- If the fix changes an endpoint, update the frontend service and mock responses in the same change.
- Run the suite for each half you touched (`./mvnw test`, plus `./mvnw clean verify` for integration-level code; `npm run lint && npm test`).
- Commit: during a sprint `fix(sprint-NN): <feature> - resolve <bug>`; otherwise "Fix <bug>".

## 5. Look for the same bug elsewhere
Search for the same pattern (same component, same query, same gateway call, same copy-pasted code, same missing check). Report each place; fix them in separate commits only if the user agrees.

## 6. Report
Root cause, the test that proves the fix, the commit hashes, any endpoint impact, other places found, and anything not verified.
