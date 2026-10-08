---
paths:
  - "src/main/java/**"
  - "src/test/java/**"
  - "src/main/resources/**"
---
# Test-driven development (TDD)

All production code in this repository is written **test-first**.

- **Red → green → refactor, one acceptance criterion (AC) at a time.**
  1. **Red:** write the tests for one AC (from the contract's `testScenarios`), run them, and see them **fail for the right reason** (an assertion failure, not a missing class or typo).
  2. **Green:** write the **minimum** production code to make them pass.
  3. **Refactor:** tidy the code and the tests with everything still green.
- **No production code without a failing test that needs it.** If you notice behaviour that has no test, write the test first.
- To get a clean assertion failure in Java, add the smallest compiling stub first (a method signature that returns a placeholder or throws `UnsupportedOperationException`), then run the test.
- **Test names say what behaviour they prove** and include the AC id, e.g. `@DisplayName("AC3: read-only role gets 403 when deleting an order")`.
- **Commit the failing tests before the code:** `test(sprint-NN): AC1 failing tests`, then `feat(sprint-NN): <feature> - implement AC1`. Refactor commits use `refactor(sprint-NN): ...` and must keep every test green.
- **Bug fixes start with a failing test that reproduces the bug:** `test(sprint-NN): reproduce <bug>`, then `fix(sprint-NN): <feature> - resolve <bug>` (outside a sprint, a sentence such as "Reproduce ..." / "Fix ...").
- **Record the evidence** for every AC in `implementation-status.json`: the tests, the red run (command and failure reason) and the green run.
- **Choose the fastest test level that proves the behaviour:** unit tests (JUnit 5 + Mockito) for services and domain logic; slice tests with mock JWTs for controllers and security; integration tests against a containerised database and other backing services for repositories, gateways, migrations and end-to-end flows. Integration tests are also written first, but may be run at the end of each AC rather than on every change.
- **Failure paths are tested first too:** `401`/`403`, validation errors, database and backing-service failures, and the compensation path of any multi-system write.
- **Exemptions** are rare and must be recorded with a reason (`tddExempt`), e.g. a dependency added to `pom.xml`. Configuration that changes behaviour (logging configuration, security config, migrations) is **not** exempt: test the behaviour it produces.
- Never delete, skip (`@Disabled`) or weaken a test to make the build pass.

For the step-by-step loop, use the `springboot-api-kit:tdd-cycle` skill; for a bug, the `springboot-api-kit:fix-bug` skill.
