---
name: api-test-infrastructure
description: Procedure for building and using the Micronaut API's shared test infrastructure - @MicronautTest with an HttpClient, Testcontainers (or Micronaut Test Resources) for the database and other backing services, a TestApplication that runs the app against those containers, outage helpers for failure paths, and fake test data. Use this whenever the test support classes do not exist yet (usually Sprint 0), or when a test needs a real database or backing service, or a simulated outage.
---

# Test infrastructure (backend)

Rules: `.claude/rules/backend-testing.md`, `tdd.md`. Templates are in `${CLAUDE_PLUGIN_ROOT}/skills/api-test-infrastructure/templates/`. They are **starting points**: verify artifact names, packages and APIs against the current Micronaut 4 and Testcontainers documentation, and replace every `VERIFY`.

## What to build (once, in `av-service/src/test/java/.../support/`)

| Class or file | Purpose |
|---|---|
| `IntegrationTestContainers` | Shared containers: the database (same engine as production) and any other backing service the project uses, started once per run, with their connection properties for `TestPropertyProvider`. |
| `TestApplication` | Runs the real app against the containers. Used by developers and the Evaluator. |
| `Outages` | Pauses a container for one test to simulate an outage, and always restores it. |
| `TestData` | Builders for fake request DTOs (`example.test` domains, obviously fake names). |

## Steps

1. **Dependencies** (test scope; let the Micronaut BOM manage versions where it can): `micronaut-test-junit5`, `micronaut-http-client`, `junit-jupiter`, `mockito-core`, `assertj-core`, and the Testcontainers JUnit module plus the module for the project's database. Or, if the team prefers it, Micronaut Test Resources (`micronaut.test.resources.enabled` in `pom.xml`). That is a tooling decision: if `docs/open-questions.md` has not settled it, stop and ask. Ask before adding anything else.
2. **Other backing services:** add a container for each one the project calls (object storage, a message broker). If an image needs a licence or an account token the team has not approved, test that service with a **mocked client** (`@MockBean`) for now and report `NEEDS-DECISION`. Read any token from an environment variable; never commit it.
3. **Red:** write one smoke test per container (connects, and a seeded entry or table is found) and a test per helper (e.g. `Outages.pause(container)` makes the gateway fail). They fail until the support classes exist.
4. **Green:** add the classes from the templates, adjusting packages and verifying APIs. Pin image tags to match production versions where known.
5. **Shared containers:** declare containers once and reuse them across test classes, so each container starts once per test run.
6. **Test levels:**
   - Unit tests: Mockito only; no Micronaut context, no containers.
   - HTTP tests (`@MicronautTest` + `@Inject @Client("/") HttpClient`): controllers, validation, status codes and error shape, with services replaced by `@MockBean` where the test is about the controller. No containers.
   - Integration tests (`@MicronautTest` implementing `TestPropertyProvider` with `IntegrationTestContainers.properties()`): the real database and backing services. Name them `*IT.java` so the Failsafe plugin runs them in `verify`.
7. **Failure paths:** `Outages.pause(container)` in integration tests, or a gateway mock that throws in unit tests. A paused container makes calls hang, so set short connect and read timeouts for every client in the test configuration.
8. **Run:** `./mvnw test` (unit + HTTP), `./mvnw verify` (with integration tests), and `TestApplication` (app with containers, see its Javadoc).

## Rules of thumb
- No test may call a real database or other real service.
- Seed data is fake; no committed secrets (generate container passwords at runtime).
- Integration tests create their own data (unique ids) so they can run in any order.
- If Docker is not available, integration tests fail with a clear message; they are never silently skipped in CI.
