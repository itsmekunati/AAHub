---
paths:
  - "av-service/src/main/java/**"
  - "av-service/src/test/java/**"
  - "av-service/src/main/resources/**"
  - "av-ui/src/**/*.js"
  - "av-ui/src/**/*.html"
  - "av-ui/test/**"
---
# Test-driven development (TDD)

All production code in this repository, in both halves, is written **test-first**.

- **Red → green → refactor, one acceptance criterion (AC) at a time.**
  1. **Red:** write the tests for one AC (from the contract's `testScenarios`), run them, and see them **fail for the right reason** (an assertion failure, not a missing class, missing module or typo).
  2. **Green:** write the **minimum** production code to make them pass.
  3. **Refactor:** tidy the code and the tests with everything still green.
- **No production code without a failing test that needs it.** If you notice behaviour that has no test, write the test first.
- To get a clean assertion failure, add the smallest stub first: in Java, a compiling method signature that returns a placeholder or throws `UnsupportedOperationException`; in AngularJS, a component with an empty template or a service method that returns a rejected promise.
- **Test names say what behaviour they prove** and include the AC id, e.g. `@DisplayName("AC3: returns 409 when the reference already exists")` or `it('AC3: moves focus to the error summary on a failed submit', ...)`.
- **Commit the failing tests before the code:** `test(sprint-NN): AC1 failing tests`, then `feat(sprint-NN): <feature> - implement AC1`. Refactor commits use `refactor(sprint-NN): ...` and must keep every test green.
- **Bug fixes start with a failing test that reproduces the bug:** `test(sprint-NN): reproduce <bug>`, then `fix(sprint-NN): <feature> - resolve <bug>` (outside a sprint, a sentence such as "Reproduce ..." / "Fix ...").
- **Record the evidence** for every AC in `implementation-status.json`: the tests, the red run (command and failure reason) and the green run.
- **Choose the fastest test level that proves the behaviour.**
  - Backend: unit tests (JUnit 5 + Mockito) for services and domain logic; HTTP tests (`@MicronautTest` + `HttpClient`) for controllers and validation; integration tests against a containerised database and other backing services for repositories, gateways, migrations and full flows. Integration tests are also written first, but may be run at the end of each AC rather than on every change.
  - Frontend: component and service tests (Karma + Jasmine + `angular-mocks`), from the user's point of view: find elements by label text and role and assert what the user sees and can do, not scope internals.
- **Failure paths and accessibility are tested first too:** validation errors, database and backing-service failures, the compensation path of any multi-system write; axe, labels, error summary focus and keyboard behaviour.
- **Outside the fast loop:** visual Design System fidelity is checked in the browser by the Evaluator, and Playwright E2E tests run against a local or test environment. Write or update E2E tests with the feature, but they are not expected to show red/green locally.
- **Exemptions** are rare and must be recorded with a reason (`tddExempt`), e.g. a dependency added to `pom.xml` or `package.json`. Configuration that changes behaviour (logging, migrations, routing) is **not** exempt: test the behaviour it produces.
- Never delete, skip (`@Disabled`, `xit`, `xdescribe`, `pending`), focus (`fit`, `fdescribe`) or weaken a test to make the build pass.

For the step-by-step loop, use the `angularjs-micronaut-kit:tdd-cycle` skill; for a bug, the `angularjs-micronaut-kit:fix-bug` skill.
