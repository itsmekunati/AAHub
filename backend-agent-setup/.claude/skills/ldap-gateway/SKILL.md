---
name: ldap-gateway
description: Test-first procedure for building or changing the ApacheDS gateway in ldap/ with Spring LDAP - configuration-driven DNs and attributes, injection-safe filters and DNs, role assignment and removal, error mapping, and integration tests against a containerised ApacheDS. Use this whenever you add or change any code that reads or writes LDAP entries, groups or role memberships.
---

# ApacheDS gateway (test-first)

Relevant rules: `.claude/rules/ldap.md`, `tdd.md`, `provisioning.md`, `audit-logging.md`, `code-style.md`. Use the `tdd-cycle` loop and the `test-infrastructure` skill (ApacheDS container, `Outages`, `AuditLogCapture`).

## 1. Check the open decisions
- How internal and external users and their roles are modelled (OUs, groups, object classes) and whether LDAPS is used are open (`docs/open-questions.md` #2). If the contract does not settle what you need, **stop and ask**, or keep the choice in configuration with no guessed production values.

## 2. Shape of the gateway
- **One interface in `ldap/`** that the service layer depends on, with intention-revealing methods, for example: `createUser`, `findByUid`, `assignRole`, `removeRole`, `rolesOf`, `disableUser`. It returns domain types, never Spring LDAP objects.
- **One mapping/config class** holds base DNs, OUs for internal and external users, the role group location, object classes and attribute names, all bound from configuration (`@ConfigurationProperties`).
- **Errors are translated** into a small set of gateway exceptions (not found, already exists, unavailable, rejected) so the service can decide on compensation and audit outcomes.

## 3. Red: write the failing tests first
**Unit tests** (Mockito), for the parts with logic:
- DN building uses the configured OU for each user type, and escapes values.
- Filters are built with the query builder, never by concatenation.
- Spring LDAP exceptions map to the right gateway exceptions.

**Integration tests** against the ApacheDS container (seeded with fake entries):
- create a user in the internal and in the external OU; find it again;
- assign a role, then read it back; remove it; assigning twice or removing a missing role behaves as the contract says;
- **injection attempts** in uid, name and email values (for example `*`, `)(uid=*`, `\`, `,`, `+`, `=`) are stored or searched literally, never interpreted;
- not found and already-exists cases map to the right gateway exceptions;
- **outage**: with `Outages.pause(apacheds)` the call fails fast (short timeout) with the "unavailable" exception.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 4. Green: implement with Spring LDAP
- Use Spring LDAP (`LdapClient` or `LdapTemplate`; check the current Spring LDAP documentation for the preferred API).
- Build filters with `LdapQueryBuilder` (or the equivalent) and DNs with `LdapNameBuilder`, which escape values. Never build a filter or DN string from user input.
- Keep a separate, clearly named LDAP configuration and bind account (least privilege, from environment/Secrets).
- Set connect and read timeouts from configuration.

Run until green, then the whole suite. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 5. Audit and refactor
- The **service layer** emits audit records for LDAP operations affecting roles (`add-audit-event` skill), including the destination host, port and protocol. Add or confirm tests with `AuditLogCapture`.
- Refactor with tests green.
