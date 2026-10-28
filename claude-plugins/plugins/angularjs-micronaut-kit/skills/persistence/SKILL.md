---
name: persistence
description: Test-first procedure for adding or changing relational database persistence in the Micronaut API - Flyway migrations, explicit Micronaut Data entity mappings, repositories, constraints and repository tests against a containerised database of the production engine. Use this whenever you add or change a table, column, entity, repository or query.
---

# Database persistence (test-first)

Relevant rules: `.claude/rules/persistence.md`, `tdd.md`, `backend-code-style.md`. Use the `angularjs-micronaut-kit:tdd-cycle` loop and the `angularjs-micronaut-kit:api-test-infrastructure` skill (the database container).

## 1. Check the open decisions
- If the contract does not define the tables and columns you need, or the schema is still open in `docs/open-questions.md`, **stop and ask**.
- Confirm which Micronaut Data flavour the project uses (Micronaut Data JDBC or Micronaut Data JPA/Hibernate) and that Flyway (`micronaut-flyway`) is the migration tool. Do not add another.

## 2. Red: write the failing tests first
Using `@MicronautTest` with `IntegrationTestContainers` (the same engine as production; do not replace it with an in-memory database):
- **Migration applies:** the context starts with Flyway enabled and the schema matches the entities (for JPA, `jpa.default.properties.hibernate.hbm2ddl.auto: validate`).
- **Round trip:** save and load an entity; every mapped field survives.
- **Constraints:** not-null, unique and foreign key rules are enforced (the expected exception is thrown).
- **Queries:** each custom repository method returns the right rows, including none.
- **Status records** (when the contract has them): each status transition is stored and queryable.
- **Concurrency** (when the contract needs it): an `@Version` column rejects a stale update.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: migration first, then mapping
1. **Migration:** add a new, versioned migration in `av-service/src/main/resources/db/migration/` (e.g. `V3__add_record_status.sql`). Never edit a migration that has already been merged; add a new one instead. Never run manual SQL against a database.
2. **Entity:** in the `persistence` package, map the table explicitly (`@MappedEntity` with `@MappedProperty` for Data JDBC, or `@Entity`/`@Table`/`@Column` for JPA; enums as strings; `@Version` where needed). Entities never leave the service layer; map to DTOs at the API boundary.
3. **Repository:** a `@JdbcRepository(dialect = ...)` or `@Repository` interface in the same package. Prefer derived query methods, which Micronaut checks at compile time; use `@Query` only where needed, always with named parameters. No string-built SQL.
4. If the project has more than one data store, keep each datasource and its repositories separate and clearly named.

Run until green, then the whole suite. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. Refactor
- Tidy with tests green. Confirm schema generation is off (or `validate`) in every environment.
