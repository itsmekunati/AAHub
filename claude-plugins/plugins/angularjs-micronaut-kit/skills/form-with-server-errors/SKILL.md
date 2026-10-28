---
name: form-with-server-errors
description: Test-first procedure for building an AngularJS form page that follows the project's design system form guidance, shows client and server validation errors as inline errors plus an error summary, manages focus, and handles submit, loading and error states. Use this whenever you build or change any form, submit flow or confirmation page.
---

# Form with server-side errors (test-first)

Relevant rules: `.claude/rules/tdd.md`, `forms-accessibility.md`, `frontend-code-style.md`, and `design-system.md` if the project has it. Checklist: `docs/reference/accessibility-checklist.md`. Follow the `angularjs-micronaut-kit:tdd-cycle` skill and use the `angularjs-micronaut-kit:ui-test-infrastructure` helpers.

## 1. Check the endpoint
- Only ask for what the endpoint needs: read the request DTO and its validation in `av-service/` (or the sprint contract if the endpoint is being built in the same sprint).
- The server's `400` error shape is the one the backend's exception handler returns (see `backend-code-style.md`); map from that, not from a guess.

## 2. Red: write the failing component tests first
Compile the form component with `compileComponent` and the right scenario, and write tests for:
- **Fields:** every field has a visible `<label for>`, a hint where specified (linked with `aria-describedby`), and the correct `autocomplete`.
- **Client checks:** required fields and basic format show inline errors plus the error summary; `$httpBackend` receives no request.
- **Server validation errors (`validationError` scenario):** the `400` response is mapped to the right fields, in plain English, with inline errors and the error summary.
- **Focus:** on a failed submit, focus moves to the error summary; each summary link moves focus to its field; `document.title` is prefixed with "Error: ".
- **Submit:** double-submit is prevented (the button is disabled or the second click is ignored while the request is pending); a loading state is shown and announced.
- **Other errors:** `409` (`conflict`) and `500` (`serverError`) show a clear notification in the design system's component, never raw server text.
- **Success:** the confirmation page (or notification) shows the values returned by the server, and focus moves to its heading.
- **axe:** no violations with and without errors.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: build the form
- Build fields from the project's design system markup (use the project's component skill in `.claude/skills/` if it has one). Use `novalidate` on the `<form>` and do the checks in the controller, so errors follow the design system pattern rather than the browser's.
- Client-side checks are for convenience only; never re-implement a rule the backend applies to decide a value.
- Submit through a service in `av-ui/src/app/services/`, which turns the response into `{ status: 'ok', data }`, `{ status: 'invalid', errors: [{ fieldId, message }] }`, `{ status: 'conflict' }` or `{ status: 'error' }`.
- Keep one list of `{ fieldId, message }` for client and server errors, and render the error summary and inline errors from it.
- Move focus with `$timeout` after the digest that renders the summary, so the element exists when it is focused.
- Implement the page title prefix, loading and success as the tests require.

Run until green, then the full suite and lint. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. Refactor and E2E
Tidy with tests green; extract the error summary into a shared component if it is not one already. Add or update the Playwright journey in `av-ui/e2e/`.
