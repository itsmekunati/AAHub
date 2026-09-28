---
name: test-infrastructure
description: Procedure for building and using the backend's shared test infrastructure - Testcontainers for Oracle, ApacheDS and S3, a TestApplication that runs the app against those containers, mock JWT helpers for admin/editor, audit log capture, and outage helpers for failure paths. Use this whenever the test support classes do not exist yet (usually Sprint 0), or when a test needs a real Oracle, LDAP or S3, a mock operator, audit assertions, or a simulated outage.
---

# Test infrastructure (backend)

Rules: `.claude/rules/testing.md`, `tdd.md`. Templates are in `templates/`. They are **starting points**: verify artifact names, packages and APIs against the current Spring Boot 4 and Testcontainers documentation (Testcontainers module and package names changed between major versions), and replace every `VERIFY`.

## What to build (once, in `src/test/java/.../support/`)

| Class or file | Purpose |
|---|---|
| `IntegrationTestContainers` | `@TestConfiguration` declaring shared containers: Oracle Free (`@ServiceConnection`), ApacheDS, and S3. Registers LDAP and S3 properties with a `DynamicPropertyRegistrar`. |
| `src/test/docker/apacheds/Dockerfile` + `src/test/resources/ldap/test-seed.ldif` | Test-only ApacheDS image built from the official Apache download, with fake seed entries. |
| `TestApplication` | Runs the real app against the containers: `./mvnw spring-boot:test-run`. Used by developers and the Evaluator. |
| `MockOperators` | Mock JWT request post-processors: `admin()`, `editor()`, `noRoles()`. |
| `AuditLogCapture` | Captures audit logger events for assertions. |
| `Outages` | Pauses a container for one test to simulate an outage, and always restores it. |
| `TestData` | Builders for fake request DTOs and users (`example.test` domains, obviously fake names). |

## Steps

1. **Dependencies** (test scope; let Spring Boot manage versions where it can): `spring-boot-starter-test`, `spring-security-test`, `spring-boot-testcontainers`, the Testcontainers JUnit and Oracle Free modules, and the S3 choice below. Ask before adding anything else.
2. **S3 choice:** `CLAUDE.md` names LocalStack, but its image has required an account auth token since March 2026 (`docs/open-questions.md` #12). If the question is unresolved, build the Oracle and ApacheDS parts, test the S3 shipping job with a **mocked S3 client** for now, and report `NEEDS-DECISION` for the S3 container. If a token is approved, read it from the `LOCALSTACK_AUTH_TOKEN` environment variable; never commit it.
3. **Red:** write one smoke test per container (connects, and a seeded entry or table is found) and a test per helper (e.g. `MockOperators.editor()` gets `403` on an admin-only endpoint; `Outages.pause(apacheds)` makes the gateway fail). They fail until the support classes exist.
4. **Green:** add the classes from `templates/`, adjusting packages and verifying APIs. Pin image tags to match production versions where known.
5. **Shared containers:** declare containers once and reuse them across test classes, so each container starts once per test run.
6. **Test levels:**
   - Unit tests: Mockito only; no containers.
   - Slice tests (`@WebMvcTest`): `MockOperators` + mocked services; no containers.
   - Integration tests (`@SpringBootTest` + `@Import(IntegrationTestContainers.class)`): real Oracle, ApacheDS and S3.
7. **Security:** `MockOperators` sets authorities directly, which bypasses the Keycloak role converter. Keep **one dedicated test** of the converter with a JWT in the real claim shape.
8. **Failure paths:** `Outages.pause(container)` in integration tests, or a gateway mock that throws in unit tests. A paused container makes calls hang, so set short connect/read timeouts for LDAP, JDBC and S3 in the test configuration.
9. **Run:** `./mvnw test` (unit + slice), `./mvnw verify` (with integration tests), `./mvnw spring-boot:test-run` (app with containers).

## Rules of thumb
- No test may call a real Keycloak, directory, database or bucket.
- Seed data and test users are fake; no committed secrets (generate container passwords at runtime).
- Integration tests create their own data (unique ids) so they can run in any order.
- If Docker is not available, integration tests fail with a clear message; they are never silently skipped in CI.
