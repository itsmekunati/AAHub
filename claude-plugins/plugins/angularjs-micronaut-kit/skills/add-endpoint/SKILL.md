---
name: add-endpoint
description: Test-first procedure for adding or changing a REST endpoint in the Micronaut API, covering failing tests first, @Serdeable DTOs, Bean Validation, the error shape, and updating the AngularJS service and mock responses that call it. Use this whenever you create, rename, remove or change the request/response of any controller method, even for a small change.
---

# Add or change a REST endpoint (test-first)

Relevant rules: `.claude/rules/tdd.md`, `backend-code-style.md`, `backend-testing.md`. Follow the `angularjs-micronaut-kit:tdd-cycle` skill for each acceptance criterion.

## 1. Check the contract
- Confirm the endpoint (method, path, request, response, status codes) and its `testScenarios` are in the sprint contract.
- Find every place in `av-ui/` that calls it already (`Grep` the path in `av-ui/src/app/services/` and `av-ui/src/mocks/`). A changed endpoint is changed on both sides in this sprint.
- Prefer an additive change (add fields; don't rename or remove them).

## 2. Red: write the failing tests first
Write these before any production code (add compiling stubs for the controller, DTO and service signatures only):
- **HTTP test** (`@MicronautTest` with `@Client("/") HttpClient`, the service as a `@MockBean`): success status and response body; each invalid input → `400` with the standard error shape and the right field; each business failure (not found, conflict) → its status code.
- **Service unit tests:** the happy path and each failure path.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: implement the minimum
- **DTOs:** Java records in `api/`, annotated `@Serdeable` (and `@Introspected` where validation needs it), with Bean Validation (`@NotBlank`, `@Size`, `@Email`, ...) on every request field that needs it. Never expose persistence entities. Never accept from the request body any value the server must decide for itself.
- **Controller:** thin. `@Controller("/api/...")`, `@Validated` on the class, `@Valid @Body` on the request, call one service method, map to a response DTO and an explicit `HttpResponse` status. Errors go through the global exception handlers in `exception/`, with no stack traces in responses.
- **Service and gateways:** business logic in `service/`; each external system only through its own repository or gateway package. If the endpoint writes to more than one system, they cannot share a transaction: order the writes explicitly, and compensate or record a failed state.

Run the tests until green, then the whole unit and HTTP suite. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. The frontend side
In the same sprint, as its own AC or as part of this one:
- Add or update the service method in `av-ui/src/app/services/` that calls the endpoint, with service tests against `$httpBackend` for each status code the endpoint returns.
- Update `av-ui/src/mocks/scenarios.js` and `data.js` so the mock responses match the real DTOs and error shape exactly.

## 5. Refactor
Tidy with all tests green. Commit `refactor(sprint-NN): ...` if anything changed.

## 6. Report
State the endpoint, the TDD evidence recorded, and which frontend services and mocks changed with it.
