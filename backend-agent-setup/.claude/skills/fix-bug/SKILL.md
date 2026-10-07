---
name: fix-bug
description: Test-first procedure for fixing a bug in the Spring Boot backend - restate it, reproduce it at the fastest test level, write a failing test that reproduces it and commit it, make the smallest fix with audit and security intact, then look for the same bug elsewhere. Use this whenever you fix a reported bug or an evaluation bug, even a one-line fix.
argument-hint: "<bug description, or evaluation file and bug id>"
---

# Fix a bug (test-first)

Relevant rules: `.claude/rules/tdd.md` plus the rules for the package the bug is in. Follow the `tdd-cycle` skill; its retry guidance covers evaluation bugs. Never reproduce against a real LDAP, Futures Database, Okta or S3 environment.

## 1. Understand
- Restate the bug as **expected** vs **actual**, with the endpoint, operator role and input.
- Find the code and read the rule files for that package (`api/`, `service/`, `ldap/`, `futures/`, `audit/`, `security/`).
- If the expected behaviour is unclear or depends on an open question in `docs/open-questions.md`, stop and ask.

## 2. Reproduce
Choose the fastest test level that shows the bug (`tdd-cycle` §2):
- **Unit** (JUnit 5 + Mockito) for service logic, classification and audit record building.
- **Slice** with mock JWTs (`MockOperators`) for endpoints, validation, `401`/`403`.
- **Integration** (Testcontainers) for gateways, migrations and multi-system flows; use `Outages` for infrastructure failures.
If you cannot reproduce it, stop and report what you tried.

## 3. Red: a failing test that reproduces it
- Name it after the bug (`@DisplayName("reproduces: editor can remove roles")`).
- If the bug touches an auditable action, assert the audit record too (`AuditLogCapture`).
- Run it and confirm it fails on an assertion, not a compile error or a broken set-up.
- Commit: during a sprint `test(sprint-NN): reproduce <bug>`; otherwise a sentence such as "Reproduce <bug> in a failing test".

## 4. Green: the smallest fix
- Change only what the bug needs. Never weaken another test, validation, security or audit logging.
- If the fix changes the API contract, run the `api-contract-diff` skill and flag any breaking change.
- `./mvnw test` (and `./mvnw clean verify` if you touched integration-level code).
- Commit: during a sprint `fix(sprint-NN): <feature> - resolve <bug>`; otherwise "Fix <bug>".

## 5. Look for the same bug elsewhere
Search for the same pattern (same query, same gateway call, same missing check). Report each place; fix them in separate commits only if the user agrees.

## 6. Report
Root cause, the test that proves the fix, the commit hashes, any API contract or audit impact, other places found, and anything not verified.
