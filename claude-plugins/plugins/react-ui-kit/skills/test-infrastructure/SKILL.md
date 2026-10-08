---
name: test-infrastructure
description: Procedure for building and using the UI's shared test infrastructure - a mock API with handlers typed from the generated OpenAPI types and named scenarios, a mock implementation of the auth interface with a persona for each role, a test set-up file, a renderPage helper taking persona and scenario, axe helpers and typed fake data. Use this whenever these do not exist yet (usually Sprint 0), or when a test needs a signed-in persona, a mocked API response, an error scenario or an accessibility check.
---

# Test infrastructure (frontend)

Rules: `.claude/rules/testing.md`, `tdd.md`, `api-client.md`, and `auth.md` if the project has it. Templates are in `${CLAUDE_PLUGIN_ROOT}/skills/test-infrastructure/templates/`. They are **starting points** for Vite, Vitest (jsdom) with Testing Library and axe-core, and Mock Service Worker (MSW). If the infrastructure already exists in `src/mocks/` and `src/test/`, extend it rather than starting again. Verify library APIs against current documentation and replace every `VERIFY`.

## What to build

| File | Purpose |
|---|---|
| `src/auth/AuthClient.ts` | The small auth interface the whole UI depends on (if it does not exist yet). |
| `src/auth/mockAuth.ts` | Mock implementation with personas: one per role the project defines, plus `signed-out` and `session-expiring`. |
| `src/mocks/data.ts` | Typed fake data builders (from the generated API types). |
| `src/mocks/handlers.ts` | Default mock handlers, one per API operation the UI uses, typed from the generated types. |
| `src/mocks/scenarios.ts` | Named overrides: `success`, `empty`, `validationError`, `unauthorised`, `forbidden`, `conflict`, `serverError`, `slow`, `offline`. |
| `src/mocks/node.ts` | Mock server for tests. |
| `src/mocks/browser.ts` | Mock worker for the **development** server, so the Evaluator (and you) can run the UI without a backend. |
| `src/test/setup.ts` | Starts the mock server for every test file; unhandled requests fail the test. |
| `src/test/render.tsx` | `renderPage(ui, { persona, scenario, route })` returning `user` (user-event). |
| `src/test/axe.ts` | `expectNoAxeViolations(container)`. |

## Steps

1. **Red:** write tests for the helpers themselves:
   - `renderPage` with a persona that lacks a role hides an element only that role may see;
   - `scenario: "forbidden"` shows the permission message;
   - an unhandled request fails the test;
   - `expectNoAxeViolations` fails on a deliberately unlabelled input;
   - the production configuration refuses the mock auth and mock API.

   Commit them as `test(sprint-NN): test infrastructure`.
2. **Green:** add the files from the templates, adapting imports and environment variable names to the chosen tooling.
3. **Handlers follow the contract:** every path, method, request and response shape comes from `openapi/openapi.json` via the generated types. A handler never invents an endpoint, field or status code; error bodies use the documented error shape.
4. **Fake data only:** `example.test` emails and obviously fake names. Cover each variant the UI treats differently.
5. **Development server mode:** the development server can start the mock worker and mock auth when a development-only flag is set, with persona and scenario selectable (query parameter or a development-only switcher). Record the chosen flag and how to switch in `CLAUDE.md` "Commands".
6. **Never in production:** mock auth, the mock API library, its worker script, mock data and scenarios must not appear in a production build. Build a production bundle and search it to prove this.
7. **Use it everywhere:** every component and page test renders through `renderPage`, uses role and label queries and `user`, and calls `expectNoAxeViolations` where it renders UI. Services in `src/services/` are tested against the mock server too.
8. **Keep it current:** when a sprint adds or changes an API call, update the handler and fakes in the same sprint.
