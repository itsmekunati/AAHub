---
name: test-infrastructure
description: Procedure for building and using a Spring Boot API's shared test infrastructure - Testcontainers for the database and other backing services, a TestApplication that runs the app against those containers, mock JWT helpers for each role, audit log capture, and outage helpers for failure paths. Use this whenever the test support classes do not exist yet (usually Sprint 0), or when a test needs a real database or backing service, a mock user with a role, audit assertions, or a simulated outage.
---

# Test infrastructure (backend)

Rules: `.claude/rules/testing.md`, `tdd.md`. Templates are in `${CLAUDE_PLUGIN_ROOT}/skills/test-infrastructure/templates/`. They are **starting points**: verify artifact names, packages and APIs against the current Spring Boot 4 and Testcontainers documentation (Testcontainers module and package names changed between major versions), and replace every `VERIFY`.

## What to build (once, in `src/test/java/.../support/`)

| Class or file | Purpose |
|---|---|
| `IntegrationTestContainers` | `@TestConfiguration` declaring shared containers: the database (`@ServiceConnection`, same engine as production) and any other backing service the project uses. Registers their properties with a `DynamicPropertyRegistrar`. |
| `TestApplication` | Runs the real app against the containers: `./mvnw spring-boot:test-run`. Used by developers and the Evaluator. |
| `MockOperators` | Mock JWT request post-processors, one per role the project defines, plus `noRoles()`. |
| `AuditLogCapture` | Captures audit logger events for assertions. Only if the project has an audit log. |
| `Outages` | Pauses a container for one test to simulate an outage, and always restores it. |
| `TestData` | Builders for fake request DTOs and users (`example.test` domains, obviously fake names). |

## Steps

1. **Dependencies** (test scope; let Spring Boot manage versions where it can): `spring-boot-starter-test`, `spring-security-test`, `spring-boot-testcontainers`, the Testcontainers JUnit module and the module for the project's database. Ask before adding anything else.
2. **Other backing services:** add a container for each one the project calls (a directory, a message broker, object storage). If an image needs a licence or an account token the team has not approved, test that service with a **mocked client** for now and report `NEEDS-DECISION`. Read any token from an environment variable; never commit it.
3. **Red:** write one smoke test per container (connects, and a seeded entry or table is found) and a test per helper (e.g. a read-only role gets `403` on a write endpoint; `Outages.pause(container)` makes the gateway fail). They fail until the support classes exist.
4. **Green:** add the classes from the templates, adjusting packages and verifying APIs. Pin image tags to match production versions where known.
5. **Shared containers:** declare containers once and reuse them across test classes, so each container starts once per test run.
6. **Test levels:**
   - Unit tests: Mockito only; no containers.
   - Slice tests (`@WebMvcTest`): `MockOperators` + mocked services; no containers.
   - Integration tests (`@SpringBootTest` + `@Import(IntegrationTestContainers.class)`): the real database and backing services.
7. **Security:** `MockOperators` sets authorities directly, which bypasses the project's JWT-to-roles converter. Keep **one dedicated test** of the converter with a JWT in the real claim shape.
8. **Failure paths:** `Outages.pause(container)` in integration tests, or a gateway mock that throws in unit tests. A paused container makes calls hang, so set short connect/read timeouts for every client in the test configuration.
9. **Run:** `./mvnw test` (unit + slice), `./mvnw verify` (with integration tests), `./mvnw spring-boot:test-run` (app with containers).

## Rules of thumb
- No test may call a real identity provider, database or other real service.
- Seed data and test users are fake; no committed secrets (generate container passwords at runtime).
- Integration tests create their own data (unique ids) so they can run in any order.
- If Docker is not available, integration tests fail with a clear message; they are never silently skipped in CI.
