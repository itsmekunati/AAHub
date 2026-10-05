# CLAUDE.md: Backend (Spring Boot API)

The **backend repository** of an internal application for **user provisioning** (internal users only) and **user role management** (internal and external users). The React UI is in a separate frontend repository that Claude cannot see from here.

This file holds only what applies to **every** task. Keep it short: a fact that only matters for some files goes in the matching rule file in `.claude/rules/` or a code comment, not here.

**Status: early development.** Write production-quality code from the start. Where a decision is still open (`docs/open-questions.md`), ask rather than assume, and keep the choice easy to change.

## Stack

Java 25 (LTS), Spring Boot 4.1.x and Maven (via the committed wrapper). This API is called by the UI and writes to three places:

- **OpenDJ (LDAP)**, through Spring LDAP: the system of record for user **roles**.
- **The Futures Database** (an Oracle database in ROSA), through Spring Data JPA: the system of record for **user details and provisioning records**.
- **The audit log:** single-line JSON in a local file, rotated daily and shipped to AWS S3. It is never a source of truth for user state.

Authentication is Okta (OIDC); this API is an OAuth2 resource server. The OpenAPI contract is generated from the code with springdoc-openapi 3.x. Delivery is GitHub Actions, ROSA (OpenShift) and Argo CD.

## Architecture

- **The UI never talks to LDAP or a database directly.** All access goes through this API.
- **Layers:** controller → service → repository/gateway. No business logic in controllers. DTOs at the API boundary; never expose entities or LDAP objects.
- **Packages:** `api/`, `service/`, `ldap/`, `futures/`, `audit/`, `security/`, `config/`, `exception/`. The rule files load by these names, so keep to them.
- **Do not duplicate one system's data into the other,** and never mix the Futures Database and LDAP configurations.
- **OpenDJ and Futures Database writes cannot share one transaction.** Provisioning is an explicit ordered flow with compensation or a recorded failed state.
- **Internal or external is decided server-side only,** from the email domain. Never accept it from the client. User type is a different thing. External user flows live in User Role Management only.
- **Every transaction (create, change or remove) carries a mandatory JSM/Jira ticket** and gets its own server-generated transaction ID, which is never the ticket.
- **Two kinds of roles:** operator roles (`admin`, `editor`, read-only `viewer`) come from Okta; provisioned user roles are what this API assigns in OpenDJ.

## Non-negotiable rules

- **Work test-first (TDD):** no production code without a failing test that needs it.
- **Never commit secrets** (passwords, bind credentials, DB URLs with credentials, tokens). Use environment variables and OpenShift Secrets.
- **No hard-coded hosts, credentials, DNs, internal email domains or bucket names,** even as examples.
- **Never log** passwords, tokens, secrets or unnecessary personal data.
- **Deny by default.** Every endpoint requires authentication and declares its allowed roles: `401` for a missing or invalid token, `403` for the wrong role.
- **The acting operator's identity comes only from the validated Okta token,** never from the request body or a client-settable header.
- **Every auditable action produces an audit record, for success and failure alike,** with all mandatory fields and the request's correlation ID.
- **No injection:** parameterised LDAP filters and JPA queries only. Never build filters or SQL by string concatenation.
- **Validate on the server,** whatever the client validates.
- **Least-privilege credentials** for LDAP, Futures Database and the S3 job (IRSA, no static AWS keys).
- **Never delete, disable or weaken a test,** or weaken validation, security or audit logging, to make something pass.

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
- **Never touch real LDAP, Futures Database, Okta or S3 environments.** Use local, mock and test targets only.
- **Never bypass or weaken the Git hooks or lint configuration** (no `--no-verify`). Fix what they report.
- **Never turn Snyk on or off,** sign in to it or add ignores. If it blocks a commit, report it.
- Ask before architectural changes, new dependencies, or changes to CI/CD and deployment files.
- Flag any API contract change that could break the frontend.
- Keep changes small, explain what changed and why, and state what you could not verify.

## Where to find more

- **Rules** (`.claude/rules/`, one file per area) load automatically when you edit matching files. When planning or reviewing without editing, list that folder and read the ones for the area.
- **Skills** (`.claude/skills/`) are step-by-step procedures; each description says when to use it.
- **Docs:** `docs/open-questions.md`, `docs/reference/audit-record-schema.md`, and `docs/AGENT-WORKFLOW-GUIDE.md` (agents, hooks, Snyk).
