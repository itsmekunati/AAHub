---
paths:
  - "src/main/java/**/persistence/**"
  - "src/main/resources/db/migration/**"
  - "src/test/java/**/persistence/**"
---
# Database access via JPA and migrations

<!-- State the database engine and where it runs, e.g. "an Oracle database running inside the cluster". -->

- **Access the database via Spring Data JPA/Hibernate**, not plain JDBC and not stored procedures.
- Entities live in `persistence/`, mapped explicitly. `ddl-auto` must be `validate` or `none`.
- Manage the schema with a migration tool (Flyway or Liquibase) in `src/main/resources/db/migration/`. Never run manual SQL against a running database.
- Never edit a migration that has already been merged; add a new one.
- Native/JPQL queries only where repository method naming or the Criteria API genuinely cannot express the query, and always parameterised. No string-built SQL.
- If the project has more than one data store, give each its own clearly named datasource and beans; never mix their configuration.
- Use least-privilege credentials supplied via environment/Secrets.
- Connect through a service name configured per environment. Never hard-code a host.

For the step-by-step procedure, use the `springboot-api-kit:persistence` skill.
