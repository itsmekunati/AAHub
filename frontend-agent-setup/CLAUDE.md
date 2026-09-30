# CLAUDE.md: Frontend (React UI)

This is the **frontend repository**. The Spring Boot API lives in a separate **backend repository** (`<backend-repo>`, name TBC). Claude cannot see the backend repo from here.

This file holds only what applies to **every** task. Detailed rules live in `.claude/rules/` and load automatically when you work on matching files. See "Where to find more" at the end.

## Project overview

Internal web application for **user provisioning** (internal users only) and **user role management** (internal and external users).

An administrator enters user details in this React UI. The UI sends them to the backend API, which manages roles in Apache Directory Server (LDAP), stores user details and provisioning records in Oracle DB, and writes an audit log (a local file shipped daily to AWS S3). The UI never talks to any of those systems directly.

**Status: early development.** Build tooling and some structure decisions are still being finalised (see `docs/open-questions.md`). Write production-quality code from the start: accessible, secure, tested and maintainable. Where a decision is still open, ask rather than assume, and keep the choice easy to change.

## Tech stack

| Area | Technology |
|---|---|
| UI | React, using the Scottish Government Design System (`@scottish-government/design-system`) |
| Language | TypeScript (strict mode) |
| Node.js | Current LTS release (build tooling) |
| Build and dev server | Vite |
| Routing | React Router |
| Component tests | Vitest (jsdom), Testing Library, axe-core |
| Mock API (tests and local development) | Mock Service Worker (MSW) |
| Authentication | Keycloak (OIDC, Authorization Code flow with PKCE), operator roles `admin` and `editor` |
| API client | Types generated from the backend's OpenAPI spec (proposed: `openapi-typescript` with `openapi-fetch`) |
| E2E tests | Playwright |
| CI / hosting / CD | GitHub Actions, ROSA (Red Hat OpenShift Service on AWS), Argo CD (GitOps) |

## Key principles

- **The backend owns the API contract** (`openapi/openapi.json`). Never guess endpoint paths, fields, status codes or error formats. If something is not in the spec, ask.
- **API types and client are generated.** Never write API types by hand, and never hand-edit `openapi/openapi.json` or `src/services/api/generated/`. They are updated by the backend's spec-sync pull requests.
- **All API calls live in `src/services/`**, so a contract change is fixed in one place.
- **User type and internal/external are different things.**
  - **User Provisioning is for internal users only.** The operator chooses the **User type** (Government, Forestry or Nature) with radio buttons, and the UI sends it as `government`, `forestry` or `nature`. The user type does not make a user internal or external.
  - **Internal/external only applies in User Role Management** (not built yet). The backend decides it from the email domain: gov.uk, Forestry and Nature domains are internal, everything else is external. The UI never decides it, sends it or duplicates the domain rules; it only displays what the server returns.
- **Temporary API contract (until the backend spec exists).** The backend is not ready yet, so `src/services/provisioning.ts` holds **hand-written, clearly marked TEMPORARY** request/response types and paths, and `src/mocks/` implements them. This is the only exception to "never write API types by hand". When the first spec-sync PR arrives, replace the temporary types with the generated ones and delete this exception.
- **Two kinds of roles:** operator roles (`admin`, `editor`) come from Keycloak and control who may use the UI; provisioned user roles are what the operator assigns, stored by the backend. Do not confuse them.
- **The UI is not a security boundary.** Roles from the token decide only what to show. The backend enforces every permission; the UI handles `401` and `403` properly.
- **The backend is deployed separately.** Handle unexpected responses gracefully (clear error state, never a blank screen) and surface any contract mismatch.

## Non-negotiable rules

These apply to every change, whichever files you touch.

- **Work test-first (TDD).** No production code without a failing test that needs it: red → green → refactor, one acceptance criterion at a time. See `.claude/rules/tdd.md`.
- **Accessibility is mandatory:** WCAG 2.2 AA, built with the Scottish Government Design System's documented markup, plain English, sentence case.
- **Tokens are kept in memory only** and are never logged. No tokens or personal data in `localStorage`/`sessionStorage` unless agreed.
- **Never bypass or weaken the Keycloak sign-in flow.** No implicit flow, no password grant.
- **Never put secrets in the frontend.** Anything in the bundle is public: no passwords, API keys, credentials or internal hostnames. Build-time variables end up in the bundle.
- **Never log** personal data, tokens or full API payloads to the console.
- **Never render unsanitised HTML.** Avoid `dangerouslySetInnerHTML`, and never use it with API data or user input.
- **Never show raw server messages or stack traces** to users; map errors to plain-English messages.
- **Client-side validation is a convenience only**; the server result is always authoritative.
- **No hard-coded credentials, hostnames, environment URLs, realms or test domains**, even as examples in committed files.
- **No tests against real environments, real Keycloak realms or real people's accounts.**
- **Mock code never ships:** the mock API and mock auth used by tests and local runs are excluded from production builds (see the `test-infrastructure` skill).
- Do not add dependencies without a clear reason; prefer well-maintained packages with no known vulnerabilities.

## Repository structure

```
/
├── CLAUDE.md                 # this file (always loaded)
├── .githooks/
│   ├── pre-commit            # lint hook (ESLint, yamllint, Hadolint)
│   ├── pre-push                  # Snyk code check (off by default)
│   └── snyk.conf, snyk-lib.sh    # Snyk switches (off by default) and helpers
├── .claude/
│   ├── settings.json        # permissions and hooks (protected files)
│   ├── hooks/protect-files.sh
│   ├── rules/                # detailed, path-scoped rules (load when matching files are touched)
│   ├── skills/               # step-by-step procedures (load when relevant)
│   └── agents/               # planner, generator, evaluator
├── docs/
│   ├── open-questions.md     # decisions still to be made
│   └── reference/            # long reference material (read on demand)
├── README.md
├── package.json
├── Dockerfile
├── openapi/
│   └── openapi.json          # kept current by the backend's spec-sync PRs
├── deploy/                   # OpenShift/Kubernetes manifests for Argo CD (this UI only)
├── .github/workflows/        # GitHub Actions
├── public/
├── src/
│   ├── auth/                 # Keycloak integration behind a small interface
│   ├── components/           # Reusable components wrapping Design System markup
│   ├── pages/                # Route-level screens
│   ├── services/             # API calls (token attached here)
│   │   └── api/generated/    # Generated from openapi.json. Never edit by hand
│   ├── mocks/                # MSW mock API for tests and `npm run dev` (never in production builds)
│   ├── test/                 # Test set-up, renderApp helper, axe helper
│   └── styles/               # Design System Sass import + minimal overrides
└── e2e/                      # Playwright tests
```

## Commands

```bash
git config core.hooksPath .githooks   # once per clone: turn on the pre-commit lint hook
npm install
npm run dev               # run locally against the MOCK API (no backend needed)
npm run dev:api           # run locally against a real backend (set apiBaseUrl in public/config.json)
npm run typecheck         # TypeScript check (tsc --noEmit)
npm run lint              # ESLint, no warnings allowed
npm test                  # component tests (Vitest)
npm run test:watch        # component tests in watch mode
npm run build             # production build (mock code and the MSW worker are excluded)
```

Not set up yet (added with the backend spec and E2E work):

```bash
npm run api:update        # (local dev only) pull the spec from a locally running backend
npm run api:generate      # regenerate TypeScript types from openapi/openapi.json
npx playwright install
npx playwright test       # E2E, against a deployed test environment only
```

**Mock mode.** `npm run dev` starts the MSW mock API (`src/mocks/`). Pick an error scenario by adding `?scenario=<name>` to the first page load (names are in `src/mocks/scenarios.ts`, e.g. `lookupServerError`, `submitForbidden`, `locationsSlow`).

**Runtime configuration: one build for every environment.** The same build is deployed everywhere; only the configuration differs. At start-up the app loads `config.json` from next to `index.html` and refuses to start (showing a plain error page) if it is missing or incomplete. The file is public, so never put secrets in it. Settings:
- `apiBaseUrl`: base URL of the backend API, e.g. `/api`.
- `environmentName`: the environment name shown to operators; unique for each environment.

`public/config.json` holds the local development values and is **removed from production builds**; each deployed environment supplies its own `config.json` (in OpenShift, from a ConfigMap). Do not use `VITE_*` build-time variables for anything that differs between environments. Read settings with `getConfig()` from `src/config.ts`.

**Operator role (temporary).** Keycloak sign-in is not built yet, so the header shows every operator as **EDITOR** (`src/auth/operator.ts`). It is display only and decides nothing.

Before saying a task is done: type check, lint, build and relevant tests pass, and every change was driven by a test that was seen to fail first.

## Rules for Claude

- **Protected files** are enforced by `.claude/settings.json` and `.claude/hooks/protect-files.sh`: secrets are never read; CI, deployment, the API spec, generated types, the lock file, Git hooks and Claude settings are never edited; project guidance and configuration need your approval. If a tool call is blocked or needs approval, don't work around it (no shell writes, copies or renames): stop and say what is needed. Real environments (`oc`, `kubectl`, cloud CLIs) and network calls beyond `localhost` are blocked too.
- **Snyk security checks** are optional and **off by default** (`.githooks/snyk.conf`); a person can turn them on for their own clone with `git config hooks.snyk true`. Agents never turn Snyk on or off, never sign in to Snyk, and never add ignores to `.snyk`. If Snyk blocks a commit, report the issue; upgrading a dependency needs approval.
- A pre-commit **lint hook** (`.githooks/pre-commit`) runs on every commit. Never bypass it (no `--no-verify` or `-n`) and never weaken it or the lint configuration to get a commit through: fix what it reports.
- Ask before making architectural changes or adding major dependencies.
- Do not guess API shapes. Ask for the contract, and never hand-edit generated API files.
- Do not modify CI/CD pipelines or deployment manifests unless asked.
- Do not weaken accessibility, validation or security to make a test pass, and never delete, skip or weaken a test to make the build pass.
- Keep changes small and explain what changed and why. State clearly what you could not verify.
- When something is TBC (see `docs/open-questions.md`), ask rather than guess.
- Before working in an area, check the matching rule file below if it has not already loaded.

## Where to find more

Rules load automatically when you work on files matching their paths. Read them directly when planning or reviewing work in that area.

| Topic | File | Loads when you touch |
|---|---|---|
| Test-driven development (red → green → refactor) | `.claude/rules/tdd.md` | `*.ts`, `*.tsx` in `src/` |
| TypeScript and React conventions | `.claude/rules/code-style.md` | `*.ts`, `*.tsx`, `package.json`, ESLint config |
| Scottish Government Design System usage | `.claude/rules/design-system.md` | `src/components/`, `src/pages/`, `src/styles/` |
| Forms, accessibility and content | `.claude/rules/forms-accessibility.md` | `src/components/`, `src/pages/` |
| Keycloak sign-in, tokens, roles | `.claude/rules/auth.md` | `src/auth/`, `src/services/` |
| API contract, generated client, spec-sync | `.claude/rules/api-client.md` | `src/services/`, `openapi/` |
| Component tests | `.claude/rules/testing.md` | `*.test.ts(x)`, `*.spec.ts(x)` in `src/` |
| Playwright E2E tests | `.claude/rules/e2e.md` | `e2e/`, `playwright.config.*` |
| CI/CD and OpenShift deployment | `.claude/rules/deploy.md` | `deploy/`, `Dockerfile`, `.github/workflows/` |
| Accessibility checklist | `docs/reference/accessibility-checklist.md` | read on demand |
| Open questions | `docs/open-questions.md` | read on demand |

Step-by-step procedures live in `.claude/skills/`: `tdd-cycle`, `test-infrastructure`, `auth-integration`, `data-page`, `sg-design-system-component`, `form-with-server-errors`, `add-api-call`, `assess-spec-sync-pr`, `sprint-rubric`.
