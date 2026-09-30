---
name: tdd-cycle
description: The red-green-refactor loop for implementing one acceptance criterion test-first in the React UI, including user-centred component tests, accessibility tests written first, the commit pattern and how to record red/green evidence. Use this for every acceptance criterion you implement or fix, before writing any production code.
---

# TDD cycle (frontend)

Rule: `.claude/rules/tdd.md`. Work through this loop **once per acceptance criterion**, in the order the contract lists them.

> Tests run with Vitest. `npm test -- <path>` runs a single test file; `npm run test:watch` runs in watch mode.

## 1. Pick the scenarios
- Take the AC's `testScenarios` from `sprints/sprint-NN/contract.json` (given / when / then, with a suggested level).
- Add any cases the rules require that the scenarios miss (e.g. `401`/`403`, loading, empty and error states, axe). Note additions in `implementation-status.json`.

## 2. Red: write failing tests
- **Component and page tests** (Testing Library): render with a **mocked auth interface** and **mocked services** built from the generated API types; interact like a user (`userEvent`); query by role and label.
- **Accessibility assertions** in the same tests: axe has no violations; labels, hints and errors are associated; focus moves where it should.
- **Service tests** for `src/services/` functions: each response (success, validation error, `401`, `403`, other error) maps to the right result.
- Name each test with the AC id and behaviour: `it("AC2: hides the assign roles action for editors")`.
- If the component or function does not exist yet, add the **smallest stub** (renders `null` or throws) so the test fails on its assertion.
- Run only these tests, for example:
  ```bash
  npm test -- src/pages/CreateUserPage.test.tsx
  ```
- Confirm they **fail for the right reason**. Fix the test until they do.
- Record the red run (step 6) and commit:
  ```
  test(sprint-NN): AC2 failing tests
  ```

## 3. Green: minimum code
- Write only the code needed to pass, using the area skills (`sg-design-system-component`, `form-with-server-errors`, `add-api-call`) for how to build it.
- Run the same tests until they pass, then the whole component suite (`npm test`), `npm run typecheck` and `npm run lint`.
- Commit:
  ```
  feat(sprint-NN): <feature> - implement AC2
  ```

## 4. Refactor
- Improve names, extract components, remove duplication, with tests green after every change.
- Commit if anything changed: `refactor(sprint-NN): <what>`.

## 5. E2E and build
- Add or update Playwright tests in `e2e/` for the journey (both roles, a forbidden `editor` action where relevant). They run against the test environment in CI, not locally.
- Before handing over, run `npm run build` and confirm `npm run api:generate` produces no diff.

## 6. Record the evidence
Add or update the AC's entry under `tdd` in `sprints/sprint-NN/implementation-status.json`:

```json
"tdd": {
  "AC2": {
    "tests": ["CreateUserPage.test.tsx > AC2: hides the assign roles action for editors"],
    "red":   { "command": "npm test -- src/pages/CreateUserPage.test.tsx", "result": "1 failed: found button 'Assign roles'", "commit": "a1b2c3d" },
    "green": { "command": "npm test -- src/pages/CreateUserPage.test.tsx", "result": "1 passed", "commit": "d4e5f6a" },
    "refactored": false
  }
}
```

For a genuine exemption, record `"tddExempt": "<reason>"` instead.

## On a retry (fixing an evaluation bug)
First write a test that reproduces the bug and fails (for accessibility bugs, an assertion on focus, labels or axe), commit it as `test(sprint-NN): reproduce <bug>`, then fix it as `fix(sprint-NN): <feature> - resolve <bug>`.
