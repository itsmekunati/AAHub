---
name: data-page
description: Test-first procedure for building or changing a data-driven page that is not a form - a list, table, search results or detail view - using the project's design system components, with loading, empty, error, 401 and 403 states, role-based actions, headings, page titles and focus management. Use this whenever you build or change a page that fetches and displays data.
---

# Data page: list, table or detail view (test-first)

Relevant rules: `.claude/rules/tdd.md`, `forms-accessibility.md`, `api-client.md`, and `design-system.md` and `auth.md` if the project has them. Checklist: `docs/reference/accessibility-checklist.md`. Use the `react-ui-kit:tdd-cycle` loop and the `react-ui-kit:test-infrastructure` skill (`renderPage` with persona and scenario).

## 1. Check the contract
- Find the read operation(s) in `openapi/openapi.json`. Use only the fields the spec returns. Paging, sorting or filtering exist only if the spec supports them; otherwise report a contract mismatch rather than faking them in the UI.
- Pick the pattern from the project's design system: **table** for comparable rows, **summary list** for one record's details, plus pagination, tag or notification components as needed.

## 2. Red: write the failing page tests first
Using `renderPage(<Page />, { persona, scenario, route })`:
- **Loading:** a loading message is shown and announced to screen readers; no blank screen.
- **Success:** the expected rows or details are shown with the right headings and values, with every server-decided value shown exactly as the server returned it.
- **Empty (`empty` scenario):** a clear, plain-English empty state with a next step if there is one.
- **Error (`serverError`, `offline`):** a clear error message in the design system's notification component, never raw server text, with a way to try again.
- **`401` (`unauthorised`):** the user is sent back to sign in.
- **`403` (`forbidden`):** a "you do not have permission" message.
- **Role-based actions:** each role sees the actions (links or buttons) it is allowed and no others; a read-only role sees no add, edit or remove action and still sees the data (visibility only; the backend enforces it).
- **Structure:** one `h1`; the page title matches the page; a table has a caption and column headers (`th` with `scope`); a summary list uses the documented markup.
- **Navigation:** after arriving on the page, focus moves to the `h1`; links to detail pages have meaningful text (not "click here").
- **axe:** no violations in the success, empty and error states.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: build the page
- Fetch through a function in `src/services/` (`react-ui-kit:add-api-call` skill), returning a typed result; the page switches on it to render each state.
- Build the markup from the project's design system components (use the project's component skill in `.claude/skills/` if it has one).
- Put role checks behind the named capability helpers in `src/auth/`, never inline token parsing.
- Make each state an explicit branch, so no combination can render nothing.

Run until green, then the whole suite, type check and lint. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. Refactor and E2E
- Tidy with tests green; extract shared state components (loading, empty, error) if they repeat.
- Add or update the Playwright journey in `e2e/` for each role.
