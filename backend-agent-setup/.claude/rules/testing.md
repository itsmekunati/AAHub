---
paths:
  - "src/test/**"
---
# Testing

Shared test support (containers, mock operators, audit capture, outages) is built and used with the `test-infrastructure` skill. All tests are written **before** the code they cover (see `.claude/rules/tdd.md` and the `tdd-cycle` skill). This file says **what** must be tested; `tdd.md` says **when and how**.

- JUnit 5 + Mockito for unit tests.
- Test the **failure path** of the ApacheDS + Oracle flow, not only the happy path.
- Unit-test email-domain classification thoroughly: mixed case, surrounding whitespace, look-alike domains, subdomains, multiple `@` characters, invalid addresses.
- Unit-test the daily rotation boundary (entry just before vs just after cutover goes to the correct file) for both production (00:00 Europe/London) and non-production (19:00 Europe/London) cutovers.
- Test the S3 shipping job (uploads the right file, does not touch the file still being written, retries on failure, keeps the local copy until upload is confirmed) against a mocked S3 client or LocalStack (LocalStack now needs an account token: see `docs/open-questions.md` #12), never a real bucket.
- Use a local or containerised ApacheDS with test data, never the shared or real directory.
- Test authorisation for **every endpoint**: unauthenticated → `401`, wrong role → `403`, correct role → success. Use Spring Security's test support with mock JWTs; a real Keycloak is not needed.
- Playwright end-to-end tests live in the frontend repo and run against a deployed test environment whose backend uses test ApacheDS/Oracle and a test S3 bucket/prefix.

## Audit tests

- Audit records are generated for `401` and `403` responses and other authorisation failures.
- Audit records are generated for account creation, deletion, enablement, disablement and role changes.
- Audit records are generated for provisioning success, failure and partial failure.
- All mandatory audit fields are present, and the schema is consistent across event types.
- Source IP, operator identity and correlation identifiers are captured correctly.
- Application exceptions and infrastructure failures generate audit records.
