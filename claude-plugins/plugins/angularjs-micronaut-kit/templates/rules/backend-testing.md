---
paths:
  - "av-service/src/test/**"
---
# Backend testing

Shared test support (containers, outages, test data) is built and used with the `angularjs-micronaut-kit:api-test-infrastructure` skill. All tests are written **before** the code they cover (see `.claude/rules/tdd.md` and the `angularjs-micronaut-kit:tdd-cycle` skill). This file says **what** must be tested; `tdd.md` says **when and how**.

- JUnit 5 + Mockito for unit tests; `@MicronautTest` with an injected `HttpClient` for endpoints; integration tests named `*IT.java`.
- Test the **failure path** of every flow that writes to more than one system, not only the happy path.
- Unit-test every server-side decision thoroughly at its boundaries: mixed case, surrounding whitespace, look-alike values, missing, empty and unknown values.
- Use a local or containerised database and backing services with test data, never a shared or real one.
- Test each request with every mandatory field missing in turn: each is `400` naming the field, in the project's error shape.
- Test each business failure an endpoint can return (`404`, `409`) with its status code and error shape.
- Playwright end-to-end tests live in `av-ui/e2e/`.

<!-- SETUP: add this application's own test requirements below: the business rules that must always be covered. -->
