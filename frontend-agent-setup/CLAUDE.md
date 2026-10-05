# CLAUDE.md: Frontend (React UI)

The **frontend repository** of an internal web application for **user provisioning** (internal users only) and **user role management** (internal and external users). The Spring Boot API is in a separate backend repository that Claude cannot see from here; the UI talks only to that API.

This file holds only what applies to **every** task. Keep it short: a fact that only matters for some files goes in the matching rule file in `.claude/rules/` or a code comment, not here.

**Status: early development.** Write production-quality code from the start. Where a decision is still open (`docs/open-questions.md`), ask rather than assume.

## Stack

React, strict TypeScript, Vite and React Router (versions and scripts are in `package.json`). Not obvious from the code:

- **UI:** the Scottish Government Design System, which is plain HTML/CSS/JS wrapped in our own React components.
- **Mock API:** Mock Service Worker (MSW), for tests and for local development.
- **Not built yet:** Okta sign-in (OIDC with PKCE, operator roles `admin`, `editor` and read-only `viewer`), the generated OpenAPI client, Playwright E2E, CI and deployment.
- **One build for every environment**, configured at run time by a public `config.json`.

## Key principles

- **The backend owns the API contract.** Never guess paths, fields, status codes or error formats; if it is not in the spec, ask. Never write or edit generated API types by hand.
- **All API calls live in `src/services/`.**
- **The UI is not a security boundary.** Roles only decide what to show; the backend enforces every permission. Handle `401` and `403` properly.
- **The UI never decides whether a user is internal or external.** It displays what the backend returns.
- **Never a blank screen.** The backend is deployed separately, so handle unexpected responses with a clear error state.

## Non-negotiable rules

- **Work test-first (TDD):** no production code without a failing test that needs it.
- **Accessibility is mandatory:** WCAG 2.2 AA, the Design System's documented markup, plain English, sentence case.
- **No secrets in the frontend:** the bundle and `config.json` are public. No hard-coded credentials, hostnames, environment URLs, issuers or test domains, even as examples.
- **Tokens stay in memory only:** never in `localStorage` or `sessionStorage`, and no personal data there either. Never weaken the Okta sign-in flow.
- **Never log** personal data, tokens or full API payloads, and never show users raw server messages or stack traces.
- **Never render unsanitised HTML** (`dangerouslySetInnerHTML` with API data or user input).
- **The server result is authoritative;** client-side validation is a convenience only.
- **No tests against real environments or real people's accounts,** and mock code never ships in a production build.
- **Never delete, skip or weaken a test,** or weaken accessibility, validation or security, to make something pass.

## Commands

```bash
git config core.hooksPath .githooks   # once per clone: turn on the Git hooks
npm run dev        # local, against the MOCK API
npm run dev:api    # local, against a real backend
npm run typecheck && npm run lint && npm test && npm run build   # all must pass before a task is done
```

## Rules for Claude

- **If a tool call is blocked or needs approval, do not work around it.** Stop and say what is needed.
- **Never bypass or weaken the Git hooks or lint configuration** (no `--no-verify`). Fix what they report.
- **Never turn Snyk on or off,** sign in to it or add ignores. If it blocks a commit, report it.
- Ask before architectural changes, new dependencies, or changes to CI/CD and deployment files.
- Keep changes small, explain what changed and why, and state what you could not verify.

## Where to find more

- **Rules** (`.claude/rules/`, one file per area) load automatically when you edit matching files. When planning or reviewing without editing, list that folder and read the ones for the area.
- **Skills** (`.claude/skills/`) are step-by-step procedures; each description says when to use it.
- **Docs:** `docs/open-questions.md`, `docs/reference/accessibility-checklist.md`, and `docs/AGENT-WORKFLOW-GUIDE.md` (agents, hooks, Snyk).
