# CLAUDE.md: Backend (Spring Boot API)

<!-- SETUP: replace this paragraph. Say in two or three sentences what this application does and who uses it. -->
The **backend repository** of `<application name>`: `<what it does and for whom>`. The React UI is in a separate frontend repository that Claude cannot see from here.

This file holds only what applies to **every** task. Keep it short: a fact that only matters for some files goes in the matching rule file in `.claude/rules/` or a code comment, not here.

**Status: early development.** Write production-quality code from the start. Where a decision is still open (`docs/open-questions.md`), ask rather than assume, and keep the choice easy to change.

## Stack

Java 25 (LTS), Spring Boot 4.1.x and Maven (via the committed wrapper). This API is called by the UI and writes to:

<!-- SETUP: list each system this API reads or writes, and what it is the system of record for. -->
- **`<database>`**, through Spring Data JPA: the system of record for `<what>`.

Authentication is OIDC; this API is an OAuth2 resource server. The OpenAPI contract is generated from the code with springdoc-openapi 3.x. Delivery is GitHub Actions, OpenShift and Argo CD.

## Architecture

- **The UI never talks to a database or another backing system directly.** All access goes through this API.
- **Layers:** controller → service → repository/gateway. No business logic in controllers. DTOs at the API boundary; never expose entities.
- **Packages:** `api/`, `service/`, `persistence/`, `security/`, `config/`, `exception/`, plus one gateway package per external system. The rule files load by these names, so keep to them.
- **Do not duplicate one system's data into another.**
- **Writes to two systems cannot share one transaction.** Make it an explicit ordered flow with compensation or a recorded failed state.
- **Anything the server must decide is decided server-side only.** Never accept it from the client.

<!-- SETUP: add this application's own architectural rules here. -->

## Non-negotiable rules

- **Work test-first (TDD):** no production code without a failing test that needs it.
- **Never commit secrets** (passwords, credentials, DB URLs with credentials, tokens). Use environment variables and OpenShift Secrets.
- **No hard-coded hosts, credentials or environment-specific names,** even as examples.
- **Never log** passwords, tokens, secrets or unnecessary personal data.
- **Deny by default.** Every endpoint requires authentication and declares its allowed roles: `401` for a missing or invalid token, `403` for the wrong role.
- **The caller's identity comes only from the validated token,** never from the request body or a client-settable header.
- **No injection:** parameterised queries only. Never build SQL or filters by string concatenation.
- **Validate on the server,** whatever the client validates.
- **Least-privilege credentials** for every system this API connects to.
- **Never delete, disable or weaken a test,** or weaken validation or security, to make something pass.

## Commands

```bash
git config core.hooksPath .githooks   # once per clone: turn on the Git hooks
./mvnw test                  # unit and slice tests only (fast, no containers)
./mvnw clean verify          # build and all tests; must pass before a task is done
./mvnw spring-boot:run       # run locally
./mvnw spring-boot:test-run  # run locally against Testcontainers
```

## Rules for Claude

- **If a tool call is blocked or needs approval, do not work around it.** Stop and say what is needed.
- **Never touch a real database, identity provider or other real environment.** Use local, mock and test targets only.
- **Never bypass or weaken the Git hooks or lint configuration** (no `--no-verify`). Fix what they report.
- **Never turn Snyk on or off,** sign in to it or add ignores. If it blocks a commit, report it.
- Ask before architectural changes, new dependencies, or changes to CI/CD and deployment files.
- Flag any API contract change that could break the frontend.
- Keep changes small, explain what changed and why, and state what you could not verify.

## Where to find more

- **Rules** (`.claude/rules/`, one file per area) load automatically when you edit matching files. When planning or reviewing without editing, list that folder and read the ones for the area.
- **Skills** are step-by-step procedures; each description says when to use it. Most come from the `springboot-api-kit` plugin (`/springboot-api-kit:<name>`); project-specific ones are in `.claude/skills/`.
- **Agents:** `springboot-api-kit:planner`, `springboot-api-kit:generator` and `springboot-api-kit:evaluator` run the sprint loop.
- **Docs:** `docs/open-questions.md`.
