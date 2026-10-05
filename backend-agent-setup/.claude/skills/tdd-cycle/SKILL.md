---
name: tdd-cycle
description: The red-green-refactor loop for implementing one acceptance criterion test-first in the Spring Boot backend, including how to get a clean failing test in Java, which test level to choose, the commit pattern and how to record red/green evidence. Use this for every acceptance criterion you implement or fix, before writing any production code.
---

# TDD cycle (backend)

Rule: `.claude/rules/tdd.md`. Work through this loop **once per acceptance criterion**, in the order the contract lists them.

## 1. Pick the scenarios
- Take the AC's `testScenarios` from `sprints/sprint-NN/contract.json` (given / when / then, with a suggested level).
- Add any failure paths the rules require that the scenarios miss (e.g. `401`/`403` for a new endpoint, the second-write failure for provisioning). Note additions in `implementation-status.json`.

## 2. Red: write failing tests
- Choose the fastest level that proves the behaviour:
  - **Unit** (JUnit 5 + Mockito): services, classification, audit record building.
  - **Slice** (`@WebMvcTest` or equivalent + Spring Security test mock JWTs): endpoints, validation, `401`/`403`.
  - **Integration** (containerised OpenDJ/Futures Database; S3 via LocalStack or a mocked client, see open question #12): gateways, migrations, full flows.
- Name each test with the AC id and the behaviour: `@DisplayName("AC2: editor gets 403 when creating a user")`.
- If the production type does not exist yet, add the **smallest compiling stub** (signature only, returning a placeholder or throwing `UnsupportedOperationException`).
- Run only these tests, for example:
  ```bash
  ./mvnw -q test -Dtest='EmailClassifierTest' -Dsurefire.failIfNoSpecifiedTests=false
  ```
- Confirm they **fail for the right reason** (assertion or expected exception), not a compile error or a broken test set-up. Fix the test until it does.
- Record the red run in `implementation-status.json` (see step 6) and commit:
  ```
  test(sprint-NN): AC2 failing tests
  ```

## 3. Green: minimum code
- Write only the production code needed to make these tests pass. No extra features, no speculative options.
- Run the same tests until they pass. Then run the whole unit and slice suite (`./mvnw -q test`) to check nothing else broke.
- Commit:
  ```
  feat(sprint-NN): <feature> - implement AC2
  ```

## 4. Refactor
- Improve names, remove duplication, apply the layering and style rules, with tests green after every change.
- Tests may be refactored too, but must still prove the same behaviour.
- Commit if anything changed: `refactor(sprint-NN): <what>`.

## 5. Integration check
- At the end of each AC (or group of related ACs), run the integration tests for the area. Before handing over, run `./mvnw clean verify`.

## 6. Record the evidence
Add or update the AC's entry under `tdd` in `sprints/sprint-NN/implementation-status.json`:

```json
"tdd": {
  "AC2": {
    "tests": ["UserControllerTest.editorCannotCreateUser", "UserControllerTest.noTokenReturns401"],
    "red":   { "command": "./mvnw -q test -Dtest=UserControllerTest", "result": "2 failed: expected 403/401 but was 201", "commit": "a1b2c3d" },
    "green": { "command": "./mvnw -q test -Dtest=UserControllerTest", "result": "2 passed", "commit": "d4e5f6a" },
    "refactored": true
  }
}
```

For a genuine exemption, record `"tddExempt": "<reason>"` instead, e.g. `"pom.xml dependency only; behaviour covered by AC3 tests"`.

## On a retry (fixing an evaluation bug)
Treat each bug the same way: first write a test that reproduces it and fails (red), commit it as `test(sprint-NN): reproduce <bug>`, then fix it (green) as `fix(sprint-NN): <feature> - resolve <bug>`.
