# Application Access Hub: frontend

The React user interface for Application Access Hub, an internal web application for:

- **User Provisioning**: giving an internal user access (Government, Forestry or Nature user types).
- **User Role Management**: managing roles for internal and external users (not built yet).

The UI talks only to the backend API, which lives in a separate repository. The backend is not built yet, so the UI currently runs against a mock API.

## What works today

- The home page, site header, navigation and footer, built with the Scottish Government Design System.
- The **Provision user access** journey: choose a user type, look up the user by identifier, confirm them, check their details and choose a location, add the JSM/Jira ticket, submit, and see the result with its transaction ID.
- "User Role Manager" and "Check user's existing access" show a "not available yet" page.

Sign-in is not built yet. Every operator is shown as **EDITOR**, for display only.

## Getting started

You need **Node.js (current LTS)**, npm and Git.

```bash
git config core.hooksPath .githooks   # once per clone: turn on the Git hooks
npm install
npm run dev                           # start the app against the mock API
```

Open the address the terminal prints (normally `http://localhost:5173`).

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Runs the app locally against the **mock API**. No backend needed. |
| `npm run dev:api` | Runs the app against a real backend. Set `apiBaseUrl` in `public/config.json`. |
| `npm test` | Runs the component tests once (Vitest). |
| `npm run test:watch` | Runs the tests in watch mode. |
| `npm run typecheck` | TypeScript check. |
| `npm run lint` | ESLint, no warnings allowed. |
| `npm run build` | Production build into `dist/`. Mock code and the local `config.json` are left out. |

Before you say a change is done, `typecheck`, `lint`, `test` and `build` must all pass.

## Trying the app with the mock API

The mock API uses fake data from `src/mocks/data.ts`:

| User type | User identifier | Notes |
|---|---|---|
| Government | `U100001` | Complete record |
| Forestry | `Z200002` | Job title missing, so the journey stops at the details step |
| Nature | `GAKWO300003` | Complete record |

- A user is only found under their own user type.
- The ticket must look like `ITS-12345` (`ITS-` and five digits).
- To see an error case, add `?scenario=<name>` to the first page you open, for example `http://localhost:5173/?scenario=submitServerError`. The names are in `src/mocks/scenarios.ts`.

## Configuration

One build runs in every environment. At start-up the app loads `config.json` from next to `index.html` and shows an error page if it is missing or incomplete.

| Setting | Meaning |
|---|---|
| `apiBaseUrl` | Base URL of the backend API, for example `/api` |
| `environmentName` | The name of this instance, shown to operators |
| `managedEnvironments` | The environments this instance manages users in |
| `otherInstance` (optional) | A `label` and `url` linking to the instance that manages the other environments |

`public/config.json` holds the local values and is removed from production builds; each environment supplies its own. The file is public, so never put secrets in it.

## UI audit log (local only)

The UI reports a few events the backend cannot see: a journey started or cancelled, a client-side check that stopped the operator, and an error shown on screen. With `npm run dev`, each one is appended as a JSON line to `logs/ui-audit.log`.

- The file is created on the first event and is ignored by Git.
- Events never contain personal data, user identifiers or ticket text.
- It is a development convenience, not a compliance audit log. In real environments the backend will record these events.

## Project layout

```
src/
  auth/         operator role (temporary, until Okta sign-in is built)
  components/   reusable components wrapping Design System markup
  pages/        route-level screens; pages/provision/ is the provisioning journey
  services/     every API call, and the temporary API contract
  mocks/        mock API for tests and npm run dev (never in a production build)
  test/         test set-up and helpers
  styles/       Design System Sass import and small overrides
dev/            development-server-only code (the local audit log writer)
public/         config.json for local development, and the mock service worker
docs/           workflow guide, open questions, accessibility checklist
.claude/        rules, skills and agents for Claude Code
.githooks/      pre-commit lint hook and optional Snyk checks
```

## How we work

- **Test-first.** Write a failing test, then the code, then tidy up.
- **Accessibility is mandatory:** WCAG 2.2 AA, using the Design System's documented markup.
- **The backend owns the API contract.** Until it publishes its OpenAPI spec, `src/services/provisioning.ts` and `src/services/auditEvents.ts` hold a clearly marked temporary contract. Do not guess endpoints or fields.
- **Every transaction needs a JSM/Jira ticket**, and gets a separate transaction ID from the backend.
- **No secrets, personal data or tokens** in code, logs or browser storage.

## Working with Claude Code

This repository is set up for Claude Code:

- `CLAUDE.md`: the rules that apply to every task.
- `.claude/rules/`: detailed rules for each area, loaded automatically for matching files.
- `.claude/skills/`: step-by-step procedures (for example building a form or adding an API call).
- `.claude/agents/`: the planner, generator and evaluator used for sprint-style builds.

Start with `docs/AGENT-WORKFLOW-GUIDE.md`. Decisions still to be made are in `docs/open-questions.md`.

## Not built yet

Okta sign-in and role-based visibility (`admin`, `editor`, read-only `viewer`), the generated API client, User Role Management, Playwright end-to-end tests, and CI and deployment.
