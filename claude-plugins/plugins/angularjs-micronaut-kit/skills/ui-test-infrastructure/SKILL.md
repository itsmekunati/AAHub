---
name: ui-test-infrastructure
description: Procedure for building and using the AngularJS UI's shared test infrastructure - Karma with Jasmine and angular-mocks, a compileComponent helper, named $httpBackend scenarios for every outcome the UI must handle, axe helpers, fake data, and a development-only mock backend (ngMockE2E) that never reaches a production build. Use this whenever these do not exist yet (usually Sprint 0), or when a test needs a mocked API response, an error scenario or an accessibility check.
---

# Test infrastructure (frontend)

Rules: `.claude/rules/frontend-testing.md`, `tdd.md`. Templates are in `${CLAUDE_PLUGIN_ROOT}/skills/ui-test-infrastructure/templates/`. They are **starting points** for AngularJS 1.x with Karma, Jasmine, `angular-mocks` and `axe-core`. If the infrastructure already exists in `av-ui/src/mocks/` and `av-ui/test/`, extend it rather than starting again. Verify library APIs against current documentation and replace every `VERIFY`.

## What to build

| File | Purpose |
|---|---|
| `av-ui/karma.conf.js` | Karma with Jasmine and a headless browser; loads AngularJS, `angular-mocks`, `axe-core`, the app, the mocks and the specs. See `karma.conf.snippet.js`. |
| `av-ui/src/mocks/data.js` | Fake data builders, shaped like the backend's response DTOs. |
| `av-ui/src/mocks/scenarios.js` | Named scenarios: `success`, `empty`, `validationError`, `conflict`, `serverError`, `slow`, `offline`. Each registers `$httpBackend` responses. Shared by unit tests and the dev mock backend. |
| `av-ui/src/mocks/mock-backend.module.js` | Development-only module built on `ngMockE2E`, so the Evaluator (and you) can run the UI without the backend. The scenario comes from `?scenario=<name>` on the first load. |
| `av-ui/test/helpers/compile.js` | `compileComponent(html, { scenario, bindings })` returning `{ element, scope, flush }`. |
| `av-ui/test/helpers/axe.js` | `expectNoAxeViolations(element, done)`. |

## Steps

1. **Dependencies** (dev only; ask before adding anything else): `karma`, `karma-jasmine`, `karma-chrome-launcher` (headless), `jasmine-core`, `angular-mocks` at the **same version as `angular`**, `axe-core`, `@playwright/test` for E2E.
2. **Red:** write tests for the helpers themselves:
   - `compileComponent` with the `serverError` scenario renders the component's error state;
   - an unexpected request fails the test (`$httpBackend` throws on an unmatched request; `verifyNoOutstandingExpectation` in `afterEach`);
   - `expectNoAxeViolations` fails on a deliberately unlabelled input;
   - the production build does not contain the mock backend.

   Commit them as `test(sprint-NN): test infrastructure`.
3. **Green:** add the files from the templates, adapting the module name (`app`) and paths to the project.
4. **Scenarios follow the backend:** every path, method, field and status code comes from the controllers and DTOs in `av-service/`. A scenario never invents an endpoint, field or status code; error bodies use the backend's error shape.
5. **Fake data only:** `example.test` emails and obviously fake names. Cover each variant the UI treats differently.
6. **Development mode:** the dev server loads `mock-backend.module.js` and adds `mockBackend` to the app's dependencies only when a development-only flag is set. Everything else passes through to the real local API. Record the flag and how to pick a scenario in `CLAUDE.md` "Commands".
7. **Never in production:** `angular-mocks`, `ngMockE2E`, `av-ui/src/mocks/` and scenario names must not appear in a production build. Build a production bundle and search it to prove this.
8. **Use it everywhere:** every component test compiles through `compileComponent`, finds elements by label text and role, and calls `expectNoAxeViolations` where it renders UI. Services in `av-ui/src/app/services/` are tested against `$httpBackend` too.
9. **Keep it current:** when a sprint adds or changes an endpoint, update the scenarios and fakes in the same sprint.
