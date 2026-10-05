---
paths:
  - "src/main/java/**/ldap/**"
  - "src/test/java/**/ldap/**"
---
# OpenDJ via Spring LDAP

- Use **Spring LDAP** for all OpenDJ access.
- Keep all LDAP details (base DNs, object classes, attribute names) in configuration or a **single mapping class**, not scattered through the code.
- Use its own clearly named configuration and beans; never mix with the Futures Database configuration.
- **Prevent LDAP injection:** always use parameterised filters and escape DN/filter values through the library's escaping. Never build filters by string concatenation with user input.
- Use a least-privilege bind account supplied via environment/Secrets.
- Internal and external users live in different LDAP locations; how they and their roles are modelled (OUs, groups, custom object classes) and whether LDAPS is used is still open: see `docs/open-questions.md`.
- Every LDAP operation affecting user roles is audited (see `.claude/rules/audit-logging.md`).
- For development and tests, use a local or containerised OpenDJ with test data, never the shared or real directory.
