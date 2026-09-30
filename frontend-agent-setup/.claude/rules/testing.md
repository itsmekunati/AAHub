---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/**/*.spec.ts"
  - "src/**/*.spec.tsx"
  - "src/**/__tests__/**"
---
# Component tests

Shared test helpers (mock API server, `renderPage` with persona and scenario, mock auth, axe helper, typed fakes) are built and used with the `test-infrastructure` skill. All tests are written **before** the code they cover (see `.claude/rules/tdd.md` and the `tdd-cycle` skill). This file says **what** must be tested; `tdd.md` says **when and how**.

- Test form validation and error states, including server validation errors shown as inline errors plus the error summary.
- Test role-based visibility (`admin` vs `editor`) using a **mocked auth interface**, never a real Keycloak.
- Test loading, empty, error and success states, and `401`/`403` handling.
- Include automated accessibility checks (axe) for components and pages under test.
- Use role/label-based queries (`getByRole`, `getByLabelText`) rather than CSS selectors or test IDs where possible.
- Mock the API at the `src/services/` boundary using the generated types; never call a real backend.
- The mock API is **Mock Service Worker (MSW)** (decided): default handlers in `src/mocks/handlers.ts`, named error scenarios in `src/mocks/scenarios.ts`. Unhandled requests fail the test. Render pages with `renderApp({ scenario, route })` from `src/test/render.tsx`, and check accessibility with `expectNoAxeViolations` from `src/test/axe.ts`.
