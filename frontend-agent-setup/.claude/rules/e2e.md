---
paths:
  - "e2e/**"
  - "playwright.config.*"
---
# Playwright end-to-end tests

- Sign in through the **real Keycloak login page** using **dedicated test users** (one `admin`, one `editor`) in a **test realm**. Never use real people's accounts.
- Reuse the signed-in session between tests (Playwright's storage state) rather than logging in every time, and **keep that session file out of Git**.
- Test credentials come from environment variables or CI secrets, never from code.
- Cover the `admin` and `editor` paths, including an action the `editor` must not be able to do.
- Prefer role/label-based locators (`getByRole`, `getByLabel`), which also check accessibility. Avoid brittle CSS/XPath selectors.
- Tests are independent and create their own test data. Never rely on test order.
- User Provisioning: cover all three user types (Government, Forestry, Nature); all are internal users. Take test user numbers from configuration, not hard-coded values.
- User Role Management: cover both an internal and an external email domain. Take the test domains from configuration, not hard-coded values (still TBC: see `docs/open-questions.md`).
- Run only against a **deployed test environment** whose backend uses test LDAP/Oracle targets and a test S3 bucket/prefix. Never against production data or real user accounts.
- Include automated accessibility checks on key pages.
