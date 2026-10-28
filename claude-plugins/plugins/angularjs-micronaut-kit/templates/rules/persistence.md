---
paths:
  - "av-service/src/main/java/**/persistence/**"
  - "av-service/src/main/resources/db/migration/**"
  - "av-service/src/test/java/**/persistence/**"
---
# Database access via Micronaut Data and migrations

<!-- SETUP: state the database engine and where it runs, and whether the project uses Micronaut Data JDBC or Micronaut Data JPA. -->

- **Access the database via Micronaut Data** (JDBC or JPA, as chosen above), not plain JDBC and not stored procedures.
- Entities live in `persistence/`, mapped explicitly. Schema generation is off (or `validate`) in every environment.
- Manage the schema with **Flyway** (`micronaut-flyway`) in `av-service/src/main/resources/db/migration/`. Never run manual SQL against a running database.
- Never edit a migration that has already been merged; add a new one.
- `@Query` only where a derived query method genuinely cannot express the query, and always with named parameters. No string-built SQL.
- If the project has more than one data store, give each its own clearly named datasource and repositories; never mix their configuration.
- Use least-privilege credentials supplied via environment variables or Secrets.
- Connect through a service name configured per environment. Never hard-code a host.

For the step-by-step procedure, use the `angularjs-micronaut-kit:persistence` skill.
