---
name: futures-persistence
description: Test-first procedure for adding or changing Futures Database (Oracle) persistence in futures/ - Flyway or Liquibase migrations, explicit JPA entity mappings validated with ddl-auto validate, Spring Data repositories, provisioning status records, constraints and repository tests against a containerised Futures Database. Use this whenever you add or change a table, column, entity, repository or query.
---

# Futures Database persistence (test-first)

Relevant rules: `.claude/rules/futures-db.md`, `tdd.md`, `provisioning.md`, `code-style.md`. Use the `tdd-cycle` loop and the `test-infrastructure` skill (the Futures Database container, Oracle Free).

## 1. Check the open decisions
- The Futures Database schema is open (`docs/open-questions.md` #3). If the contract does not define the tables and columns you need, **stop and ask**.
- Confirm the migration tool (Flyway or Liquibase) already in the project. Do not add the other one.

## 2. Red: write the failing tests first
Using `@DataJpaTest` with the Futures Database container, Oracle Free (do not replace it with an in-memory database), or `@SpringBootTest` with `IntegrationTestContainers`:
- **Mapping matches schema:** the context starts with `ddl-auto: validate`, proving the entity matches the migrated table.
- **Round trip:** save and load an entity; every mapped field survives.
- **Constraints:** not-null, unique and foreign key rules are enforced (the expected exception is thrown).
- **Queries:** each custom repository method returns the right rows, including none.
- **Provisioning records** (when relevant): status transitions (for example `PENDING` → `COMPLETE`, `FAILED` or `PARTIALLY_PROVISIONED`) are stored and queryable, as `provisioning.md` requires.
- **Concurrency** (when the contract needs it): an `@Version` column rejects a stale update.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: migration first, then mapping
1. **Migration:** add a new, versioned migration in `src/main/resources/db/migration/` (e.g. `V3__add_provisioning_record.sql`). Never edit a migration that has already been merged; add a new one instead. Never run manual SQL against a database.
2. **Entity:** in `futures/`, map the table explicitly (`@Table`, `@Column` names and lengths, enums as strings, `@Version` where needed). Entities never leave the service layer; map to DTOs at the API boundary.
3. **Repository:** Spring Data repository in `futures/`. Prefer derived queries; use JPQL/native queries only where needed, always with parameters. No string-built SQL.
4. Keep the Futures Database datasource and repositories separate and clearly named, apart from anything LDAP.

Run until green, then the whole suite. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. Refactor
- Tidy with tests green. Confirm `ddl-auto` is still `validate` or `none` in every profile.
