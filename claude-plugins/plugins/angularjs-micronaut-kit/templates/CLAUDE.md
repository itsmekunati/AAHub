# CLAUDE.md: AngularJS UI and Micronaut API

<!-- SETUP: replace this paragraph. Say in two or three sentences what this application does and who uses it. -->
The repository of `<application name>`: `<what it does and for whom>`. The UI is in `av-ui/` and the API it calls is in `av-service/`.

This file holds only what applies to **every** task. Keep it short: a fact that only matters for some files goes in the matching rule file in `.claude/rules/` or a code comment, not here.

**Status: early development.** Write production-quality code from the start. Where a decision is still open (`docs/open-questions.md`), ask rather than assume, and keep the choice easy to change.

## Stack

- **`av-ui/`:** AngularJS 1.x (components, `angular.module`), plain JavaScript, npm. Tests use Karma, Jasmine and `angular-mocks`; E2E tests use Playwright. One build serves every environment, configured at run time by a public `config.json`.
- **`av-service/`:** Java 21 (LTS), Micronaut 4 and Maven (via the committed wrapper). Tests use JUnit 5, `@MicronautTest` and Testcontainers.
<!-- SETUP: name the design system the UI uses and how it is installed. -->
- **UI:** `<design system>`, rendered by our own AngularJS components.
<!-- SETUP: list each system the API reads or writes, and what it is the system of record for. -->
- **`<database>`**, through Micronaut Data: the system of record for `<what>`.
<!-- SETUP: sign-in and roles are not part of this kit. If the application needs them, add a rule file for them and list the decision here. -->

## Architecture

- **`av-ui-jsf/` is the legacy JSF / PrimeFaces application** being replaced. It is a read-only reference for behaviour: never edit it, and never copy JSF, CDI or PrimeFaces code into `av-ui/` or `av-service/`. Port it with `/angularjs-micronaut-kit:port-from-jsf`; progress is in `migration/progress.md`.
- **`av-service/` has existing Micronaut code.** Bring it up to these standards with `/angularjs-micronaut-kit:modernise-service` (characterisation tests first, then refactoring with no change in behaviour); progress is in `migration/service-progress.md`.
- **The UI never talks to a database or another backing system directly.** All access goes through the API.
- **Backend layers:** controller → service → repository/gateway. No business logic in controllers. DTOs at the API boundary; never expose entities.
- **Backend packages:** `api/`, `service/`, `persistence/`, `config/`, `exception/`, plus one gateway package per external system. The rule files load by these names, so keep to them.
- **Frontend:** one module per feature under `av-ui/src/app/`; every `$http` call lives in `av-ui/src/app/services/`.
- **The two halves change together.** When an endpoint changes, the frontend service and the mock responses that use it change in the same commit or sprint.
- **Writes to two systems cannot share one transaction.** Make it an explicit ordered flow with compensation or a recorded failed state.
- **Anything the server must decide is decided server-side only.** The UI never decides or duplicates it; it displays what the API returns.

<!-- SETUP: add this application's own architectural rules here. -->

## Non-negotiable rules

- **Work test-first (TDD):** no production code without a failing test that needs it, in either half.
- **Never commit secrets** (passwords, credentials, DB URLs with credentials, tokens). Use environment variables and OpenShift Secrets. The frontend bundle and `config.json` are public.
- **No hard-coded hosts, URLs, credentials or environment-specific names,** even as examples.
- **Never log** passwords, secrets or unnecessary personal data, and never show users raw server messages or stack traces.
- **No injection:** parameterised queries only on the server. Never build SQL or filters by string concatenation.
- **Validate on the server,** whatever the client validates.
- **Never render unsanitised HTML** (`ng-bind-html` or `$sce.trustAsHtml` with API data or user input).
- **Accessibility is mandatory:** WCAG 2.2 AA, the design system's documented markup, plain English, sentence case.
- **Least-privilege credentials** for every system the API connects to.
- **No tests against real environments or real people's data,** and mock code never ships in a production build.
- **Never delete, disable, skip or weaken a test,** or weaken validation, accessibility or security, to make something pass.

## Commands

<!-- SETUP: confirm these once the tooling is set up (docs/open-questions.md), including how to start the UI against the mock backend. -->
```bash
git config core.hooksPath .githooks   # once per clone: turn on the Git hooks

# av-service/
cd av-service && ./mvnw test            # unit and HTTP tests only (fast, no containers)
cd av-service && ./mvnw clean verify    # build and all tests, including integration; must pass before a task is done
cd av-service && ./mvnw mn:run          # run locally

# av-ui/
cd av-ui && npm run dev           # local UI; add the mock backend flag to run without the API
cd av-ui && npm run lint && npm test && npm run build   # all must pass before a task is done
cd av-ui && npm run e2e           # Playwright, against a local stack
```

## Rules for Claude

- **If a tool call is blocked or needs approval, do not work around it.** Stop and say what is needed.
- **Never touch a real database or other real environment.** Use local, mock and test targets only.
- **Never bypass or weaken the Git hooks or lint configuration** (no `--no-verify`). Fix what they report.
- **Never turn Snyk on or off,** sign in to it or add ignores. If it blocks a commit, report it.
- Ask before architectural changes, new dependencies, or changes to CI/CD and deployment files.
- Keep changes small, explain what changed and why, and state what you could not verify.

## Where to find more

- **Rules** (`.claude/rules/`, one file per area, prefixed `backend-` or `frontend-` where they apply to one half) load automatically when you edit matching files. When planning or reviewing without editing, list that folder and read the ones for the area.
- **Skills** are step-by-step procedures; each description says when to use it. Most come from the `angularjs-micronaut-kit` plugin (`/angularjs-micronaut-kit:<name>`); project-specific ones are in `.claude/skills/`.
- **Agents:** `angularjs-micronaut-kit:planner`, `angularjs-micronaut-kit:generator` and `angularjs-micronaut-kit:evaluator` run the sprint loop.
- **Docs:** `docs/open-questions.md` and `docs/reference/accessibility-checklist.md`.
