---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---
# Test-driven development (TDD)

All production code in this repository is written **test-first**.

- **Red → green → refactor, one acceptance criterion (AC) at a time.**
  1. **Red:** write the tests for one AC (from the contract's `testScenarios`), run them, and see them **fail for the right reason** (an assertion failure, not a missing import or type error).
  2. **Green:** write the **minimum** production code to make them pass.
  3. **Refactor:** tidy the code and the tests with everything still green.
- **No production code without a failing test that needs it.**
- To get a clean assertion failure, add the smallest stub first (e.g. a component that renders `null`, or a service function that throws), so the test compiles and fails on its assertion.
- **Test from the user's point of view:** render the component or page and use role and label queries (`getByRole`, `getByLabelText`); assert what the user sees, hears and can do, not implementation details.
- **Accessibility tests come first too:** axe, labels, error summary focus and keyboard behaviour are written as failing tests before the markup.
- **Test names say what behaviour they prove** and include the AC id, e.g. `it("AC3: moves focus to the error summary on a failed submit")`.
- **Commit the failing tests before the code:** `test(sprint-NN): AC1 failing tests`, then `feat(sprint-NN): <feature> - implement AC1`. Refactor commits use `refactor(sprint-NN): ...` and must keep every test green.
- **Record the evidence** for every AC in `implementation-status.json`: the tests, the red run (command and failure reason) and the green run.
- **Outside the fast loop:** visual Design System fidelity is checked in the browser by the Evaluator, and Playwright E2E tests run against the deployed test environment. Write or update E2E tests with the feature, but they are not expected to show red/green locally.
- **Exemptions** are rare and must be recorded with a reason (`tddExempt`), e.g. adding a dependency or pure styling that uses Design System tokens.
- Never delete, skip (`.skip`, `xit`) or weaken a test to make the build pass.

For the step-by-step loop, use the `tdd-cycle` skill.
