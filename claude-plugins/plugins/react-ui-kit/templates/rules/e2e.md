---
paths:
  - "e2e/**"
  - "playwright.config.*"
---
# Playwright end-to-end tests

- Sign in through the **real sign-in page** using **dedicated test users** (one per role) in a **test tenant** of the identity provider. Never use real people's accounts.
- Reuse the signed-in session between tests (Playwright's storage state) rather than logging in every time, and **keep that session file out of Git**.
- Test credentials come from environment variables or CI secrets, never from code.
- Cover each role's path, including an action a role must not be able to do, and that a read-only role can read but has no add, edit or remove actions.
- Prefer role/label-based locators (`getByRole`, `getByLabel`), which also check accessibility. Avoid brittle CSS/XPath selectors.
- Tests are independent and create their own test data. Never rely on test order.
- Cover each variant of a journey the UI treats differently. Take test identifiers and other test data from configuration, not hard-coded values.
- Run only against a **deployed test environment** whose backend uses test data stores. Never against production data or real user accounts.
- Include automated accessibility checks on key pages.
