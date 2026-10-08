---
name: add-endpoint
description: Test-first procedure for adding or changing a REST endpoint in a Spring Boot API, covering failing tests first, DTOs, validation, method security, audit events where the project has them, OpenAPI annotations and frontend impact. Use this whenever you create, rename, remove or change the request/response of any controller method, even for a small change.
---

# Add or change a REST endpoint (test-first)

Relevant rules: `.claude/rules/tdd.md`, `api-contract.md`, `code-style.md`, `testing.md`, plus the project's security rule and, if it has one, `audit-logging.md`. Follow the `springboot-api-kit:tdd-cycle` skill for each acceptance criterion.

## 1. Check the contract and permissions
- Confirm the operation and its `testScenarios` are in the sprint contract.
- Decide which role(s) may call it. If the project's permission matrix does not say, **stop and ask** (see `docs/open-questions.md`). Never make an endpoint public.
- Decide whether this is a **breaking change** for the frontend (renamed/removed field, changed status code, error shape or validation). Prefer an additive change.

## 2. Red: write the failing tests first
Write these before any production code (add compiling stubs for the controller, DTO and service signatures only):
- **Slice test with mock JWTs:** no token → `401`; invalid token → `401`; wrong role → `403`; correct role → success status and response body.
- **Validation:** each invalid input → `400` with the standard error shape and the right field.
- **Service unit tests:** the happy path and each failure path.
- **Audit tests** (if the project has an audit log): the expected record is produced with all mandatory fields on success and on failure (see the project's `add-audit-event` skill).

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: implement the minimum
- **DTOs:** Java records in `api/`, with Bean Validation on every request field that needs it. Never expose JPA entities or other persistence objects. Never accept the caller's identity, role, or any value the server must decide for itself from the request body.
- **Controller:** thin. Validate (`@Valid`), call one service method, map to a response DTO. Method security on the method, e.g. `@PreAuthorize("hasRole('ADMIN')")`. Errors go through the global exception handler, with no stack traces.
- **Service and gateways:** business logic in `service/`; each external system only through its own repository or gateway package. If the endpoint writes to more than one system, they cannot share a transaction: order the writes explicitly, and compensate or record a failed state. The acting user comes from the validated JWT via the security layer.
- **Audit** (if the project has an audit log): emit records for success and failure.

Run the tests until green, then the whole unit and slice suite. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. Refactor
Tidy with all tests green. Commit `refactor(sprint-NN): ...` if anything changed.

## 5. OpenAPI
- Add annotations where the generated spec would be unclear: summary, description, required fields, possible error responses (`400`, `401`, `403`, `404`, `409`, `500` as relevant), and the allowed roles in the description.
- Run `./mvnw clean verify` and inspect the regenerated `openapi.json`. Never hand-edit it.

## 6. Report
State the endpoint, allowed roles, the TDD evidence recorded, and whether the API change is breaking. Breaking changes use a `!` commit type, e.g. `feat(sprint-NN)!: ...`.
