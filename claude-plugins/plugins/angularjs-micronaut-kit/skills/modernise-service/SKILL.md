---
name: modernise-service
description: Bring the existing Micronaut code in av-service/ up to the project's standards - inventory it, add characterisation tests that pin down what it does today (endpoints, services, repositories, failure paths), then refactor it to Micronaut 4 and Java 21 conventions with those tests green, area by area, committing each step and tracking progress in migration/ so a long run can stop and resume. Use this when the user asks to add tests to, clean up, upgrade or modernise the existing backend code.
argument-hint: "[all | resume | <package, class or endpoint path>]"
disable-model-invocation: true
---

# Modernise the existing Micronaut service

Relevant rules: `.claude/rules/backend-code-style.md`, `backend-testing.md`, `persistence.md`, `tdd.md`. Test support comes from the `angularjs-micronaut-kit:api-test-infrastructure` skill. Run this **before** `angularjs-micronaut-kit:port-from-jsf`, so the port builds on tested code.

Arguments:
- `all`: inventory the whole of `av-service/`, agree the plan once, then work through every area in order.
- `resume`: continue from `migration/service-progress.md`.
- `<package, class or endpoint path>`: inventory and modernise only that area.

## Two rules that make this safe

1. **Behaviour does not change.** Endpoint paths, methods, request and response fields, status codes, the error shape, database writes and side effects stay exactly as they are, because `av-ui/`, `av-ui-jsf/` and possibly other systems depend on them. A refactor that changes behaviour is a bug. If the current behaviour looks wrong, **do not fix it here**: record it as a suspected bug and ask.
2. **Tests come before any change.** Existing code already works, so its first tests are **characterisation tests**: they describe what the code does today and pass on the current code. Each area is refactored only after its characterisation tests are committed and green.

## 1. Inventory (read-only)

Read `av-service/` and write `migration/service-inventory.json`:
- **Build and versions:** Micronaut version, Java version (`maven.compiler.release` or equivalent), build tool, Micronaut modules in use (`micronaut-data-*`, `micronaut-serde-*` or Jackson, validation, management, flyway or liquibase), test dependencies, and whether Testcontainers or Test Resources is already set up.
- **Endpoints:** every `@Controller` method: method, path, request and response types, status codes, and which service it calls.
- **Services, repositories, entities, clients:** each class, what it depends on, the tables it reads and writes, and any outbound HTTP clients or other systems.
- **Existing tests:** what each covers, and whether it passes today (`./mvnw test` and `./mvnw verify`; record failures, do not fix them yet).
- **Gaps against the standards:** for each class, the items from the checklist in step 3 that it breaks.

Each area entry (group areas by feature or package, smallest dependency first: repositories, then services, then controllers): `{ id, classes, endpoints, tables, existingTests, gaps, suspectedBugs, dependsOn, status: "pending" }`.

## 2. Plan and confirm (once)

Write `migration/service-progress.md`:
- **Platform first, if needed.** If the service is not on Micronaut 4.x and Java 21, the first step is the upgrade, and it is a **decision for the user**: it changes `pom.xml` (ask-first), may change `javax.*` to `jakarta.*`, and Micronaut 3 to 4 has breaking changes (Serde instead of Jackson databind by default, validation module changes). Propose it as its own step, run it only after the characterisation tests for the whole service are green, and follow the official Micronaut 4 migration guide.
- **Test infrastructure:** if `av-service/src/test/java/.../support/` is missing, build it first with `api-test-infrastructure`.
- **Order:** areas in dependency order.
- **Questions:** every suspected bug, every gap whose fix would change behaviour or a public type, any package restructuring (moving classes into `api/`, `service/`, `persistence/`, ...), and any new dependency, numbered.

Show the plan and the questions. **Stop and wait for the user's answers and OK.** Record the answers in `migration/service-progress.md`; project-wide decisions also go to `docs/open-questions.md` through `angularjs-micronaut-kit:record-decision`.

With `all`, this is the only confirmation: after it, work through every area without asking again, unless an area raises a new question.

## 3. Modernise each area (repeat)

For the next `pending` area in `migration/service-progress.md`:

### a. Characterisation tests
Mark the area `in-progress`. Re-read its code. Write tests at the right level (see `api-test-infrastructure`):
- **Controllers:** `@MicronautTest` + `HttpClient` for every endpoint: the success response (status, body fields), each validation failure, each business failure (not found, conflict), and the exact error shape. Assert what the code returns **today**.
- **Services:** unit tests (Mockito) for every public method: happy path, every branch, every exception, and boundary inputs (missing, empty, case and whitespace variants).
- **Repositories and queries:** integration tests against the containerised database: each custom query, constraints, and the migrations applying cleanly.
- **Failure paths:** database or downstream system unavailable (`Outages`), and partial failure of any multi-system write.

Name them for the behaviour, prefixed with the area: `@DisplayName("records: returns 409 when the reference already exists")`. Run them: **they must pass on the unchanged code**. A test that fails here has found either a wrong test or a real bug: fix the test, or record the bug as a question and assert the current behaviour with a comment pointing to it.

**Prove the tests bite:** for at least two behaviours in the area, temporarily break the code (remove a validation, flip a condition), confirm a test fails, then restore it exactly (`git diff` must be empty afterwards).

Commit: `test(modernise): <area> characterisation tests`.

### b. Refactor to the standards
With the tests green after **every** change, apply the checklist below. Keep each commit to one kind of change, so a reviewer can follow it:

- **Java 21:** records for DTOs and value types; `var` for obvious local types; switch expressions and pattern matching (`instanceof` patterns, record patterns, pattern `switch`) instead of `if`/cast chains; text blocks for multi-line SQL or JSON; sealed interfaces where a closed set of types already exists; `List.of` / `Map.of` and streams where they make code clearer. No preview features.
- **Micronaut 4:** constructor injection only (no field or setter `@Inject`), beans `@Singleton` with `final` fields; `jakarta.*` annotations; `@Serdeable` on DTOs (and `@Introspected` where validation needs it) rather than reflection-based serialisation; `@Validated` controllers with `@Valid @Body`; Bean Validation on request DTOs; typed `@ConfigurationProperties` instead of scattered `@Value`; `ExceptionHandler` beans in `exception/` producing one error shape; explicit `HttpResponse` statuses; declarative `@Client` interfaces for outbound HTTP; Micronaut Data derived queries, or `@Query` with named parameters; no `System.out`, SLF4J only, nothing sensitive logged; no hard-coded hosts or credentials.
- **Design:** thin controllers; business logic in services; entities never returned from controllers (map to DTOs); dead code, commented-out code and unused dependencies removed; long methods split; names made meaningful.

Rules while refactoring:
- Do not change endpoint paths, request or response field names, status codes, the error shape, or the database schema. If a standard can only be met by changing one of them, leave it and add it to the questions.
- Do not move classes between packages unless the plan agreed it.
- Do not add or upgrade dependencies, or touch `pom.xml`, unless the plan agreed it (`pom.xml` is ask-first).
- If a test has to change for a refactor to pass, the refactor changed behaviour: undo it.

Run `./mvnw test` after each step, and `./mvnw verify` at the end of the area. Commit each step: `refactor(modernise): <area> - <what changed>`.

### c. Record
Mark the area `done` in `migration/service-progress.md` with the commit hashes, the standards applied, anything deliberately left (and why), and suspected bugs found. If the area needs a decision you cannot make, mark it `needs-decision` with the question and move on to the next area that does not depend on it.

Keep going until every area is `done` or `needs-decision`. If the session is interrupted, `/angularjs-micronaut-kit:modernise-service resume` continues from the file.

## 4. Finish

- `./mvnw clean verify` in `av-service/`, and `bash .githooks/pre-commit --all`.
- Offer `angularjs-micronaut-kit:review-code` on the whole branch.
- Report: areas done, areas waiting on a decision (with the questions), suspected bugs found (not fixed), tests added per area, standards applied, and anything left on purpose.

## Hard lines
- Never change behaviour while modernising; never fix a suspected bug without the user's agreement (then use `angularjs-micronaut-kit:fix-bug`, as its own change).
- Never delete, disable or weaken an existing test. A failing existing test is reported, not removed.
- Never connect to a real database or environment; data comes from containers and fakes.
- Never edit `av-ui-jsf/`.
