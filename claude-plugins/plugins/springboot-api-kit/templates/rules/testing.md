---
paths:
  - "src/test/**"
---
# Testing

Shared test support (containers, mock users with roles, outages) is built and used with the `springboot-api-kit:test-infrastructure` skill. All tests are written **before** the code they cover (see `.claude/rules/tdd.md` and the `springboot-api-kit:tdd-cycle` skill). This file says **what** must be tested; `tdd.md` says **when and how**.

- JUnit 5 + Mockito for unit tests.
- Test the **failure path** of every flow that writes to more than one system, not only the happy path.
- Unit-test every server-side decision thoroughly at its boundaries: mixed case, surrounding whitespace, look-alike values, missing, empty and unknown values.
- Use a local or containerised database and backing services with test data, never a shared or real one.
- Test authorisation for **every endpoint**: unauthenticated → `401`, wrong role → `403`, correct role → success. Use Spring Security's test support with mock JWTs; a real identity provider is not needed.
- Test that a read-only role gets `403` on **every** endpoint that creates, changes or deletes anything.
- Test each request with every mandatory field missing in turn: each is `400` naming the field.
- Playwright end-to-end tests live in the frontend repo and run against a deployed test environment whose backend uses test data stores.

<!-- Add this application's own test requirements below: the business rules that must always be covered. -->
