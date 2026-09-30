---
name: add-endpoint
description: Test-first procedure for adding or changing a REST endpoint in the user-provisioning backend, covering failing tests first, DTOs, validation, method security, audit events, OpenAPI annotations and frontend impact. Use this whenever you create, rename, remove or change the request/response of any controller method, even for a small change.
---

# Add or change a REST endpoint (test-first)

Relevant rules: `.claude/rules/tdd.md`, `api-contract.md`, `security-keycloak.md`, `audit-logging.md`, `code-style.md`, `testing.md`. Follow the `tdd-cycle` skill for each acceptance criterion.

## 1. Check the contract and permissions
- Confirm the operation and its `testScenarios` are in the sprint contract.
- Decide which operator role(s) may call it. If the permission matrix does not say, **stop and ask** (see `docs/open-questions.md` #7). Never make an endpoint public.
- Decide whether this is a **breaking change** for the frontend (renamed/removed field, changed status code, error shape or validation). Prefer an additive change.

## 2. Red: write the failing tests first
Write these before any production code (add compiling stubs for the controller, DTO and service signatures only):
- **Slice test with mock JWTs:** no token → `401`; invalid token → `401`; wrong role → `403`; correct role → success status and response body.
- **Validation:** each invalid input → `400` with the standard error shape and the right field.
- **Service unit tests:** the happy path and each failure path.
- **Audit tests:** the expected record is produced with all mandatory fields on success and on failure (see the `add-audit-event` skill).

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: implement the minimum
- **DTOs:** Java records in `api/`, with Bean Validation on every request field that needs it. Never expose JPA entities or LDAP objects. Never accept an internal/external classification, operator identity or operator role from the request body. Provisioning requests carry a `userType` that is validated as `user-classification.md` describes.
- **Controller:** thin. Validate (`@Valid`), call one service method, map to a response DTO. Method security on the method, e.g. `@PreAuthorize("hasRole('ADMIN')")`. Errors go through the global exception handler, with no stack traces.
- **Service and gateways:** business logic in `service/`; ApacheDS only through `ldap/`, Oracle only through `oracle/`. If the endpoint writes to both, use the `provisioning-flow` skill. The acting operator comes from the validated JWT via the security layer.
- **Audit:** emit records for success and failure (`add-audit-event` skill).

Run the tests until green, then the whole unit and slice suite. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. Refactor
Tidy with all tests green. Commit `refactor(sprint-NN): ...` if anything changed.

## 5. OpenAPI
- Add annotations where the generated spec would be unclear: summary, description, required fields, possible error responses (`400`, `401`, `403`, `404`, `409`, `500` as relevant), and the allowed roles in the description.
- Run `./mvnw clean verify` and inspect the regenerated `openapi.json`. Never hand-edit it.

## 6. Report
State the endpoint, allowed roles, the TDD evidence recorded, and whether the API change is breaking. Breaking changes use a `!` commit type, e.g. `feat(sprint-NN)!: ...`.
