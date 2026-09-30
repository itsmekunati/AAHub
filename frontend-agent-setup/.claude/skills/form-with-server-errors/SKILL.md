---
name: form-with-server-errors
description: Test-first procedure for building a form page that follows Scottish Government Design System form guidance, shows client and server validation errors as inline errors plus an error summary, manages focus, and handles submit, loading, 401 and 403 states. Use this whenever you build or change any form, submit flow or confirmation page.
---

# Form with server-side errors (test-first)

Relevant rules: `.claude/rules/tdd.md`, `forms-accessibility.md`, `design-system.md`, `api-client.md`, `auth.md`. Checklist: `docs/reference/accessibility-checklist.md`. Follow the `tdd-cycle` skill.

## 1. Check the contract
- Only ask for what the API operation needs (check `openapi/openapi.json`). The user type is chosen once, as radio buttons (Government, Forestry, Nature), at the start of the journey.

## 2. Red: write the failing page tests first
Render the page with a mocked auth interface and a mocked service (generated types), and write tests for:
- **Fields:** every field has a visible label, hint where specified, correct `autocomplete`.
- **Client checks:** required fields and basic format show inline errors plus the error summary; no request is sent.
- **Server validation errors:** a mocked `400` response is mapped to the right fields, in plain English, with inline errors and the error summary.
- **Focus:** on a failed submit, focus moves to the error summary; each summary link moves focus to its field; the page title is prefixed with "Error: ".
- **Submit:** double-submit is prevented; a loading state is shown and announced.
- **Other errors:** `409`/`500` show a clear Design System notification, never raw server text; `401` sends the user to sign in; `403` shows a "you do not have permission" message.
- **Success:** the confirmation page (or notification) shows the values returned by the server, including the user type, and focus moves to its heading.
- **axe:** no violations with and without errors.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: build the form
- Build fields from Design System components (`sg-design-system-component` skill).
- Client-side checks are for convenience only; never re-implement server rules such as the internal/external email domain logic.
- Submit through `src/services/` (`add-api-call` skill).
- Map client and server errors to one list of `{ fieldId, message }`, rendering the error summary and inline errors from it.
- Implement focus management, page title prefix, loading, `401`/`403` and success as the tests require.

Run until green, then the full suite, type check and lint. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. Refactor and E2E
Tidy with tests green. Add or update the Playwright journey in `e2e/` for both roles.
