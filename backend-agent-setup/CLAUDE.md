# CLAUDE.md: Backend (Spring Boot API)

This is the **backend repository**. The React UI lives in a separate **frontend repository** (`<frontend-repo>`, name TBC). Claude cannot see the frontend repo from here.

This file holds only what applies to **every** task. Detailed rules live in `.claude/rules/` and load automatically when you work on matching files. See "Where to find more" at the end.

## Project overview

Internal application for **user role management and user provisioning** for both **internal and external users**.

An administrator enters user details in the React UI. This backend then:

1. Manages the user's **roles** in **Apache Directory Server (LDAP)**, the system of record for roles
2. Stores **user details and provisioning records** in **Oracle DB** (running in ROSA), the system of record for user details and provisioning
3. Writes a structured **audit record** for every action to a local log file, rotated daily and shipped to **AWS S3**

**Status: early development.** Build tooling and some structure decisions are still being finalised (see `docs/open-questions.md`). Write production-quality code from the start: secure, tested, observable and maintainable. Where a decision is still open, ask rather than assume, and keep the choice easy to change.

## Tech stack

| Area | Technology |
|---|---|
| Language / framework | Java 25 (LTS), Spring Boot 4.1.x (latest stable 4.1 patch), Maven |
| Role management | LDAP, Apache Directory Server (ApacheDS), via Spring LDAP |
| User details and provisioning | Oracle DB (deployed in ROSA), Spring Data JPA/Hibernate |
| Audit / logs | SLF4J + Logback + Logstash Logback Encoder; local daily file shipped to AWS S3; S3 lifecycle expires logs after 90 days |
| Authentication | Keycloak (OIDC). This API is an OAuth2 resource server using Spring Security |
| API contract | OpenAPI, generated from code with springdoc-openapi 3.x |
| CI / hosting / CD | GitHub Actions, ROSA (Red Hat OpenShift Service on AWS), Argo CD (GitOps) |

## Architecture

```
React UI (separate repo) ──HTTPS──►  This API ──►  Apache Directory Server (LDAP)  (user roles)
                                               ├─►  Oracle DB, in ROSA             (user details + provisioning)
                                               └─►  Local log file ──(daily)──► AWS S3  (audit log)
```

- The UI never talks to LDAP or a database directly. All access goes through this API.
- **Data ownership:** roles live in ApacheDS; user details and provisioning records live in Oracle. Do not duplicate one system's data into the other unless explicitly required. The audit log is never a source of truth for user state.
- Layers: controller → service → repository/gateway. Controllers contain no business logic. DTOs at the API boundary; never expose entities or LDAP objects.
- Two separate, clearly named configurations: Oracle and LDAP. Never mix repositories across them. The audit log is a file, not a datasource.
- **ApacheDS and Oracle writes cannot share one transaction.** Provisioning is an explicit ordered flow with compensation or a recorded failed state, and every step is audited.
- **User type (internal/external) is decided server-side only**, from the email domain, against a configured list. Never accept a user type from the client.
- **Two kinds of roles:** operator roles (`admin`, `editor`) come from Keycloak and control who may use this API; provisioned user roles are what this API assigns, stored in ApacheDS. Do not confuse them.

## Non-negotiable rules

These apply to every change, whichever files you touch.

- **Work test-first (TDD).** No production code without a failing test that needs it: red → green → refactor, one acceptance criterion at a time. See `.claude/rules/tdd.md`.
- **Never commit secrets** (passwords, bind credentials, DB URLs with credentials, tokens). Use environment variables / OpenShift Secrets.
- **Never log** passwords, tokens, secrets or unnecessary personal data.
- **Deny by default.** Every endpoint requires authentication and declares its allowed role(s). Return `401` for missing/invalid tokens and `403` for the wrong role. No privilege escalation.
- **The acting operator's identity comes only from the validated Keycloak token**, never from the request body or a client-settable header.
- **Every auditable action produces an audit record, for success and failure alike**, as single-line JSON with all mandatory fields and the request's correlation ID.
- **No injection:** parameterised LDAP filters with library escaping; JPA/parameterised queries only for Oracle. Never build filters or SQL by string concatenation.
- Validate on the server regardless of any client-side validation.
- Least-privilege credentials for LDAP, Oracle and the S3 job (IRSA, no static AWS keys).
- No hard-coded hosts, credentials, DNs, internal email domains or bucket names, even as examples.
- Do not add dependencies without a clear reason; prefer well-maintained libraries with no known vulnerabilities.

## Repository structure

```
/
├── CLAUDE.md                     # this file (always loaded)
├── .githooks/
│   ├── pre-commit                # lint hook (Checkstyle once configured, yamllint, Hadolint)
│   ├── pre-push                  # Snyk code check (off by default)
│   └── snyk.conf, snyk-lib.sh    # Snyk switches (off by default) and helpers
├── .claude/
│   ├── settings.json            # permissions and hooks (protected files)
│   ├── hooks/protect-files.sh
│   ├── rules/                    # detailed, path-scoped rules (load when matching files are touched)
│   ├── skills/                   # step-by-step procedures (load when relevant)
│   └── agents/                   # planner, generator, evaluator
├── docs/
│   ├── open-questions.md         # decisions still to be made
│   └── reference/                # long reference material (read on demand)
├── pom.xml
├── Dockerfile
├── deploy/                       # OpenShift/Kubernetes manifests for Argo CD (this service only)
├── .github/workflows/            # GitHub Actions
└── src/
    ├── main/java/.../
    │   ├── api/                  # REST controllers + request/response DTOs
    │   ├── service/              # Business logic / provisioning orchestration
    │   ├── ldap/                 # ApacheDS gateway
    │   ├── oracle/               # Oracle repositories/entities
    │   ├── audit/                # Audit logging + S3 shipping job
    │   ├── security/             # Keycloak JWT -> roles mapping, method security
    │   ├── config/               # Datasource, LDAP, security config
    │   └── exception/            # Error types + global handler
    ├── main/resources/
    │   ├── application.yml
    │   └── db/migration/         # Oracle schema migrations
    └── test/java/...
```

## Commands

Build tool is **Maven** via the committed wrapper.

```bash
git config core.hooksPath .githooks   # once per clone: turn on the pre-commit lint hook
./mvnw clean verify        # build + tests (springdoc plugin generates openapi.json during integration-test)
./mvnw test                # unit + slice tests only (fast, no containers)
./mvnw spring-boot:run     # run locally
./mvnw spring-boot:test-run  # run locally against Testcontainers (once the test-infrastructure skill has created TestApplication)
```

Before saying a task is done: build passes, relevant tests pass, and every change was driven by a test that was seen to fail first.

## Rules for Claude

- **Protected files** are enforced by `.claude/settings.json` and `.claude/hooks/protect-files.sh`: secrets are never read; CI, deployment, build-wrapper, merged migrations, Git hooks and Claude settings are never edited; project guidance and configuration need your approval. If a tool call is blocked or needs approval, don't work around it (no shell writes, copies or renames): stop and say what is needed. Real environments (`oc`, `kubectl`, cloud CLIs) and network calls beyond `localhost` are blocked too.
- **Snyk security checks** are optional and **off by default** (`.githooks/snyk.conf`); a person can turn them on for their own clone with `git config hooks.snyk true`. Agents never turn Snyk on or off, never sign in to Snyk, and never add ignores to `.snyk`. If Snyk blocks a commit, report the issue; upgrading a dependency needs approval.
- A pre-commit **lint hook** (`.githooks/pre-commit`) runs on every commit. Never bypass it (no `--no-verify` or `-n`) and never weaken it or the lint configuration to get a commit through: fix what it reports.
- Ask before making architectural changes, adding major dependencies, or changing the datasource/LDAP design.
- Do not touch real LDAP, Oracle, Keycloak or S3 environments. Work against local/mock/test targets only (Testcontainers and mocks: see the `test-infrastructure` skill).
- Do not modify CI/CD pipelines or deployment manifests unless asked.
- Do not weaken validation, security or audit logging to make a test pass, and never delete, disable or weaken a test to make the build pass.
- Flag any API contract change that could break the frontend.
- Keep changes small and explain what changed and why. State clearly what you could not verify.
- When something is TBC (see `docs/open-questions.md`), ask rather than guess.
- Before working in an area, check the matching rule file below if it has not already loaded.

## Where to find more

Rules load automatically when you work on files matching their paths. Read them directly when planning or reviewing work in that area.

| Topic | File | Loads when you touch |
|---|---|---|
| Test-driven development (red → green → refactor) | `.claude/rules/tdd.md` | all production and test code |
| Java and Spring Boot 4 conventions | `.claude/rules/code-style.md` | `**/*.java`, `pom.xml` |
| Email-domain user classification | `.claude/rules/user-classification.md` | `service/`, `api/` |
| Provisioning flow across ApacheDS and Oracle | `.claude/rules/provisioning.md` | `service/`, `ldap/`, `oracle/` |
| Keycloak authentication and authorisation | `.claude/rules/security-keycloak.md` | `security/`, `api/`, `config/` |
| Audit events, fields, format, MDC, correlation IDs | `.claude/rules/audit-logging.md` | all production Java, `logback*.xml` |
| Daily rotation, S3 shipping, retention | `.claude/rules/log-shipping.md` | `audit/`, `logback*.xml` |
| ApacheDS / Spring LDAP | `.claude/rules/ldap.md` | `ldap/` |
| Oracle / JPA / migrations | `.claude/rules/oracle-jpa.md` | `oracle/`, `db/migration/` |
| API contract, springdoc, frontend impact | `.claude/rules/api-contract.md` | `api/`, `exception/` |
| Testing | `.claude/rules/testing.md` | `src/test/` |
| CI/CD and OpenShift deployment | `.claude/rules/deploy.md` | `deploy/`, `Dockerfile`, `.github/workflows/` |
| Audit record schema and example | `docs/reference/audit-record-schema.md` | read on demand |
| Open questions | `docs/open-questions.md` | read on demand |

Step-by-step procedures live in `.claude/skills/`: `tdd-cycle`, `test-infrastructure`, `add-endpoint`, `provisioning-flow`, `add-audit-event`, `ldap-gateway`, `oracle-persistence`, `sprint-rubric`.
