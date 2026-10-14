---
paths:
  - "e2e/**"
  - "playwright.config.*"
---
# Playwright end-to-end tests

- Sign in through the **real Okta login page** using **dedicated test users** (one `admin`, one `editor`, one `viewer`) in a **test Okta org**. Never use real people's accounts.
- Reuse the signed-in session between tests (Playwright's storage state) rather than logging in every time, and **keep that session file out of Git**.
- Test credentials come from environment variables or CI secrets, never from code.
- Cover the `admin`, `editor` and `viewer` paths, including an action the `editor` must not be able to do, and that a `viewer` can read but has no add, edit or remove actions.
- Prefer role/label-based locators (`getByRole`, `getByLabel`), which also check accessibility. Avoid brittle CSS/XPath selectors.
- Tests are independent and create their own test data. Never rely on test order.
- User Provisioning: cover all three user types (Scottish Government, Scottish Forestry, NatureScot); all are internal users. Take test user identifiers and JSM/Jira tickets from configuration, not hard-coded values. NatureScot users are not looked up: the test pastes a CSV line, from `E2E_NATURE_USER_INFO` against a deployed environment.
- User Role Management: cover both an internal and an external user. **Internal (decided):** an email address on `gov.scot`, `forestry.gov.scot` or `nature.scot`; every other address is external. The backend decides this; the tests only exercise one user of each kind. Take the test users from configuration (`E2E_ROLE_INTERNAL_USER`, `E2E_ROLE_EXTERNAL_USER`), not hard-coded values.
- Run only against a **deployed test environment** whose backend uses test LDAP/Futures Database targets and a test S3 bucket/prefix. Never against production data or real user accounts.
- Include automated accessibility checks on key pages.
