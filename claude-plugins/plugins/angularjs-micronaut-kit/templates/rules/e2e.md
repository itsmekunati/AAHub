---
paths:
  - "av-ui/e2e/**"
  - "av-ui/playwright.config.*"
---
# Playwright end-to-end tests

- Run against a **local stack** (the API with containerised dependencies and the UI dev server) or a **deployed test environment** whose backend uses test data stores. Never against production data or real people's accounts.
- Any credentials or environment URLs come from environment variables or CI secrets, never from code. Keep any saved browser session files out of Git.
- Prefer role- and label-based locators (`getByRole`, `getByLabel`), which also check accessibility. Avoid brittle CSS/XPath selectors.
- Tests are independent and create their own test data. Never rely on test order.
- Cover each variant of a journey the UI treats differently, including a server validation error and a server failure. Take test identifiers and other test data from configuration, not hard-coded values.
- Include automated accessibility checks on key pages.
