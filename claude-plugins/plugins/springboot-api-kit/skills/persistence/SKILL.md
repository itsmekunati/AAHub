---
name: persistence
description: Test-first procedure for adding or changing relational database persistence in a Spring Boot API - Flyway or Liquibase migrations, explicit JPA entity mappings validated with ddl-auto validate, Spring Data repositories, constraints and repository tests against a containerised database of the production engine. Use this whenever you add or change a table, column, entity, repository or query.
---

# Database persistence (test-first)

Relevant rules: `.claude/rules/persistence.md`, `tdd.md`, `code-style.md`. Use the `springboot-api-kit:tdd-cycle` loop and the `springboot-api-kit:test-infrastructure` skill (the database container).

## 1. Check the open decisions
- If the contract does not define the tables and columns you need, or the schema is still open in `docs/open-questions.md`, **stop and ask**.
- Confirm the migration tool (Flyway or Liquibase) already in the project. Do not add the other one.

## 2. Red: write the failing tests first
Using `@DataJpaTest` with the database container (the same engine as production; do not replace it with an in-memory database), or `@SpringBootTest` with `IntegrationTestContainers`:
- **Mapping matches schema:** the context starts with `ddl-auto: validate`, proving the entity matches the migrated table.
- **Round trip:** save and load an entity; every mapped field survives.
- **Constraints:** not-null, unique and foreign key rules are enforced (the expected exception is thrown).
- **Queries:** each custom repository method returns the right rows, including none.
- **Status records** (when the contract has them): each status transition is stored and queryable.
- **Concurrency** (when the contract needs it): an `@Version` column rejects a stale update.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: migration first, then mapping
1. **Migration:** add a new, versioned migration in `src/main/resources/db/migration/` (e.g. `V3__add_order_status.sql`). Never edit a migration that has already been merged; add a new one instead. Never run manual SQL against a database.
2. **Entity:** in the project's persistence package, map the table explicitly (`@Table`, `@Column` names and lengths, enums as strings, `@Version` where needed). Entities never leave the service layer; map to DTOs at the API boundary.
3. **Repository:** Spring Data repository in the same package. Prefer derived queries; use JPQL/native queries only where needed, always with parameters. No string-built SQL.
4. If the project has more than one data store, keep each datasource and its repositories separate and clearly named.

Run until green, then the whole suite. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. Refactor
- Tidy with tests green. Confirm `ddl-auto` is still `validate` or `none` in every profile.
