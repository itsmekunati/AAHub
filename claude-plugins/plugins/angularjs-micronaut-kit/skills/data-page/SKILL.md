---
name: data-page
description: Test-first procedure for building or changing a data-driven AngularJS page that is not a form - a list, table, search results or detail view - using the project's design system markup, with loading, empty and error states, headings, page titles and focus management. Use this whenever you build or change a page that fetches and displays data.
---

# Data page: list, table or detail view (test-first)

Relevant rules: `.claude/rules/tdd.md`, `forms-accessibility.md`, `frontend-code-style.md`, and `design-system.md` if the project has it. Checklist: `docs/reference/accessibility-checklist.md`. Use the `angularjs-micronaut-kit:tdd-cycle` loop and the `angularjs-micronaut-kit:ui-test-infrastructure` helpers (`compileComponent`, scenarios, axe).

## 1. Check the endpoint
- Find the read endpoint(s) in the sprint contract and in `av-service/` (the controller and response DTO). Use only the fields it returns. Paging, sorting or filtering exist only if the endpoint supports them; otherwise add them to the backend in the same sprint (with the `angularjs-micronaut-kit:add-endpoint` skill) or report it, rather than faking them in the UI.
- Pick the pattern from the project's design system: **table** for comparable rows, **summary list** for one record's details, plus pagination, tag or notification components as needed.

## 2. Red: write the failing component tests first
Compile the page component with the `compileComponent` helper and a scenario, then write tests for:
- **Loading:** a loading message is shown and announced to screen readers (`aria-live`) before `$httpBackend.flush()`; no blank screen.
- **Success:** the expected rows or details are shown with the right headings and values, with every server-decided value shown exactly as the server returned it.
- **Empty (`empty` scenario):** a clear, plain-English empty state with a next step if there is one.
- **Error (`serverError`, `offline`):** a clear error message in the design system's notification component, never raw server text, with a way to try again.
- **Structure:** one `h1`; the page title matches the page; a table has a caption and column headers (`th` with `scope`); a summary list uses the documented markup.
- **Navigation:** after the route changes to this page, focus moves to the `h1`; links to detail pages have meaningful text (not "click here").
- **axe:** no violations in the success, empty and error states.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: build the page
- Fetch through a service in `av-ui/src/app/services/` that returns a promise of a small result object (`{ status: 'ok', data }`, `{ status: 'empty' }`, `{ status: 'error' }`); the component switches on it to render each state. Components never call `$http` directly.
- Build the markup from the project's design system (use the project's component skill in `.claude/skills/` if it has one). Bind text with `{{ }}` or `ng-bind`, never `ng-bind-html` on API data.
- Make each state an explicit branch (`ng-if` / `ng-switch`), so no combination can render nothing.
- Use `track by` on every `ng-repeat` over API data.

Run until green, then the whole suite and lint. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. Refactor and E2E
- Tidy with tests green; extract shared state components (loading, empty, error) if they repeat.
- Add or update the Playwright journey in `av-ui/e2e/`.
