---
paths:
  - "src/test/**"
---
# Testing

Shared test support (containers, mock operators, audit capture, outages) is built and used with the `test-infrastructure` skill. All tests are written **before** the code they cover (see `.claude/rules/tdd.md` and the `tdd-cycle` skill). This file says **what** must be tested; `tdd.md` says **when and how**.

- JUnit 5 + Mockito for unit tests.
- Test the **failure path** of the OpenDJ + Futures Database flow, not only the happy path.
- Unit-test email-domain classification (User Role Management) thoroughly: mixed case, surrounding whitespace, look-alike domains, subdomains, multiple `@` characters, invalid addresses.
- Unit-test `userType` validation (User Provisioning): `government`, `forestry` and `nature` accepted; missing, empty, unknown or wrongly cased values rejected.
- Unit-test the daily rotation boundary (entry just before vs just after cutover goes to the correct file) for both production (00:00 Europe/London) and non-production (19:00 Europe/London) cutovers.
- Test the S3 shipping job (uploads the right file, does not touch the file still being written, retries on failure, keeps the local copy until upload is confirmed) against a mocked S3 client or LocalStack (LocalStack now needs an account token: see `docs/open-questions.md` #12), never a real bucket.
- Use a local or containerised OpenDJ with test data, never the shared or real directory.
- Test authorisation for **every endpoint**: unauthenticated → `401`, wrong role → `403`, correct role → success. Use Spring Security's test support with mock JWTs; a real Okta is not needed.
- Test that a `viewer` gets `403` on **every** endpoint that creates, changes or deletes anything, including adding, editing and removing roles, and that the denial is audited.
- Playwright end-to-end tests live in the frontend repo and run against a deployed test environment whose backend uses test OpenDJ/Futures Database and a test S3 bucket/prefix.
- Test every transaction endpoint: a missing or blank JSM/Jira ticket is `400`; the returned `transactionId` is unique for each transaction and is never the ticket; two transactions with the same ticket get different transaction IDs.
- Test User Provisioning with each mandatory field missing in turn (first name, surname, email, user identifier, manager X number, job title, location): each is `400` naming the field.

## Audit tests

- Every transaction's audit records carry both the `transactionId` and the `ticketId`.
- Audit records are generated for `401` and `403` responses and other authorisation failures.
- Audit records are generated for account creation, deletion, enablement, disablement and role changes.
- Audit records are generated for provisioning success, failure and partial failure.
- All mandatory audit fields are present, and the schema is consistent across event types.
- Source IP, operator identity and correlation identifiers are captured correctly.
- Application exceptions and infrastructure failures generate audit records.
