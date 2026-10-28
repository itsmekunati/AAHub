---
name: tdd-cycle
description: The red-green-refactor loop for implementing one acceptance criterion test-first, in the Micronaut backend (JUnit 5, @MicronautTest, Testcontainers) or the AngularJS frontend (Karma, Jasmine, angular-mocks), including which test level to choose, accessibility tests written first, the commit pattern and how to record red/green evidence. Use this for every acceptance criterion you implement or fix, before writing any production code.
---

# TDD cycle

Rule: `.claude/rules/tdd.md`. Work through this loop **once per acceptance criterion**, in the order the contract lists them. The AC's `layer` (`backend`, `frontend` or `both`) says which half you are in; for `both`, do the backend first.

## 1. Pick the scenarios
- Take the AC's `testScenarios` from `sprints/sprint-NN/contract.json` (given / when / then, with a suggested level).
- Add any cases the rules require that the scenarios miss: for an endpoint, `400` for each invalid input and the failure of each downstream call; for a screen, loading, empty and error states and axe. Note additions in `implementation-status.json`.

## 2. Red: write failing tests

### Backend (`av-service/`)
- Choose the fastest level that proves the behaviour:
  - **Unit** (JUnit 5 + Mockito): services, domain logic, mapping.
  - **HTTP** (`@MicronautTest` with an `HttpClient`, services replaced with `@MockBean` where the test is about the controller): endpoints, validation, status codes, error shape.
  - **Integration** (`@MicronautTest` against Testcontainers or Micronaut Test Resources for the database and any other backing service): repositories, gateways, migrations, full flows.
- Name each test with the AC id and the behaviour: `@DisplayName("AC2: returns 409 when the reference already exists")`.
- If the production type does not exist yet, add the **smallest compiling stub** (signature only, returning a placeholder or throwing `UnsupportedOperationException`).
- Run only these tests, for example:
  ```bash
  cd av-service && ./mvnw -q test -Dtest='RecordServiceTest' -Dsurefire.failIfNoSpecifiedTests=false
  ```

### Frontend (`av-ui/`)
- **Component tests** (Jasmine + `angular-mocks`): compile the component with `$compile` into a `$rootScope` scope (or use `$componentController` for controller-only logic), respond to its requests with `$httpBackend` scenarios, interact with the DOM like a user, and find elements by label text and role, not CSS class.
- **Accessibility assertions** in the same tests: axe has no violations; labels, hints and errors are associated; focus moves where it should.
- **Service tests** for `av-ui/src/app/services/`: each response (success, `400` validation error, `409`, other error, network failure) maps to the right result. `$httpBackend.verifyNoOutstandingExpectation()` and `verifyNoOutstandingRequest()` in `afterEach`.
- Name each test with the AC id and behaviour: `it('AC2: moves focus to the error summary when the server rejects the form', ...)`.
- If the component or service does not exist yet, add the **smallest stub** (an empty template or a method that rejects) so the test fails on its assertion.
- Run only these tests, for example:
  ```bash
  cd av-ui && npm test -- --grep 'AC2'    # VERIFY: the filter flag your Karma set-up supports
  ```

### Both
- Confirm they **fail for the right reason** (an assertion or expected exception), not a compile error, a missing module or a broken test set-up. Fix the test until they do.
- Record the red run (step 6) and commit:
  ```
  test(sprint-NN): AC2 failing tests
  ```

## 3. Green: minimum code
- Write only the code needed to make these tests pass, using the area skills (`angularjs-micronaut-kit:add-endpoint`, `angularjs-micronaut-kit:persistence`, `angularjs-micronaut-kit:form-with-server-errors`, `angularjs-micronaut-kit:data-page`, and the project's component skill if it has one). No extra features, no speculative options.
- Run the same tests until they pass, then the whole suite for that half (`./mvnw -q test` or `npm test`) and, for the frontend, `npm run lint`.
- Commit:
  ```
  feat(sprint-NN): <feature> - implement AC2
  ```

## 4. Refactor
- Improve names, remove duplication, extract components or services, apply the layering and style rules, with tests green after every change.
- Tests may be refactored too, but must still prove the same behaviour.
- Commit if anything changed: `refactor(sprint-NN): <what>`.

## 5. Integration, E2E and build
- Backend: at the end of each AC (or group of related ACs), run the integration tests for the area. Before handing over, run `./mvnw clean verify`.
- Frontend: add or update Playwright tests in `av-ui/e2e/` for the journey. Before handing over, run `npm run build`.

## 6. Record the evidence
Add or update the AC's entry under `tdd` in `sprints/sprint-NN/implementation-status.json`:

```json
"tdd": {
  "AC2": {
    "layer": "frontend",
    "tests": ["createRecord.component.spec.js > AC2: moves focus to the error summary when the server rejects the form"],
    "red":   { "command": "npm test -- --grep AC2", "result": "1 failed: expected focus on the error summary", "commit": "a1b2c3d" },
    "green": { "command": "npm test -- --grep AC2", "result": "1 passed", "commit": "d4e5f6a" },
    "refactored": false
  }
}
```

For a genuine exemption, record `"tddExempt": "<reason>"` instead, e.g. `"pom.xml dependency only; behaviour covered by AC3 tests"`.

## On a retry (fixing an evaluation bug)
Treat each bug the same way: first write a test that reproduces it and fails (for accessibility bugs, an assertion on focus, labels or axe), commit it as `test(sprint-NN): reproduce <bug>`, then fix it as `fix(sprint-NN): <feature> - resolve <bug>`.
