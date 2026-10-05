---
paths:
  - "src/main/java/**/futures/**"
  - "src/main/resources/db/migration/**"
  - "src/test/java/**/futures/**"
---
# Futures Database via JPA and migrations

- **The Futures Database is an Oracle database running inside ROSA.** Connect through its in-cluster service name, configured per environment. Assume it needs persistent storage and a backup/retention plan.
- **Access the Futures Database via Spring Data JPA/Hibernate**, not plain JDBC and not stored procedures.
- Entities live in `futures/`, mapped explicitly. `ddl-auto` must be `validate` or `none`.
- Manage the schema with a migration tool (Flyway or Liquibase) in `src/main/resources/db/migration/`. Never run manual SQL against a running database.
- Native/JPQL queries only where repository method naming or the Criteria API genuinely cannot express the query, and always parameterised. No string-built SQL.
- Use its own clearly named datasource and beans; never mix with the LDAP configuration.
- Use least-privilege credentials supplied via environment/Secrets.
- The Futures Database schema for user details and provisioning is still open: see `docs/open-questions.md`.
