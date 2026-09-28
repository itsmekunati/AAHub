# Open questions

Decisions still to be made. **Agents must ask rather than guess** when a task depends on any of these.

When a question is answered: record the decision in the matching rule file under `.claude/rules/`, then delete it from this list.

| # | Question | Affects | Rule file to update |
|---|---|---|---|
| 1 | Which email domains count as internal, and do subdomains count? Is the list the same in every environment? Which domains are internal in the test environment? | Classification, tests | `user-classification.md` |
| 2 | ApacheDS schema: how are internal vs external users and roles modelled (OUs, groups, custom object classes)? Is it accessed over LDAPS? | LDAP gateway | `ldap.md` |
| 3 | What does the Oracle schema for user details and provisioning look like? | Entities, migrations | `oracle-jpa.md` |
| 4 | Which S3 bucket/prefix, and which AWS account? | Shipping job | `log-shipping.md` |
| 5 | How often does the S3 shipping scheduler run (once shortly after each cutover, or more frequently as a safety margin)? | Shipping job | `log-shipping.md` |
| 6 | Does the local log directory need a persistent volume, given pods can be rescheduled before that day's file is shipped? | Shipping, deployment | `log-shipping.md`, `deploy.md` |
| 7 | What may `admin` and `editor` each do (permission matrix)? Can an `editor` create external users, or assign roles? | Every endpoint | `security-keycloak.md` |
| 8 | Keycloak: realm, client ID, and where the `admin`/`editor` roles appear in the token (realm or client roles)? Who manages the Keycloak configuration? | Security config | `security-keycloak.md` |
| 9 | Failure strategy when one of ApacheDS/Oracle succeeds and the other fails: which is written first? | Provisioning flow | `provisioning.md` |
| 10 | What credential does the spec-sync workflow use to trigger the frontend repo (a GitHub App installation scoped to that repo is preferred)? Who reviews the resulting frontend PRs? | CI | `deploy.md`, `api-contract.md` |
| 11 | Do the UI and API share an origin through OpenShift routes, or are they on different origins (needing CORS)? How is the UI served in ROSA? | CORS, routing | `api-contract.md`, `security-keycloak.md` |
| 12 | S3 in tests: LocalStack's Docker image has required an account auth token since March 2026. Does the team have an approved LocalStack token for local and CI use, or should S3 tests use a mocked S3 client (or another token-free S3 emulator)? | S3 shipping tests | `testing.md`, `test-infrastructure` skill |
| 13 | Java code style, formatter and linter: e.g. Spotless with Palantir or Google Java Format, and Checkstyle (the pre-commit lint hook runs Checkstyle once it is configured in `pom.xml`)? | Formatting, lint hook, CI | `code-style.md` |
| 14 | **Decided:** a pre-commit lint hook (`.githooks/pre-commit`, plain Git hooks). **Still open:** any other checks before commit or push (secrets scanning, blocking `.env`/keys/log files, commit message format, formatting, tests before push; not before commit, because TDD commits failing tests), whether to adopt a hook manager (e.g. Lefthook, pre-commit, Husky), and whether agents get Claude Code hooks that block bypassing the checks and `git push`. | Every commit, the Generator and Evaluator, CI | `.githooks/`, `CLAUDE.md`, the guide |
| 15 | Snyk: the checks are built in but **off by default**. Which Snyk organisation and plan will the team use, should the team default be switched on later, and is the Snyk code check (which uploads source code to Snyk) approved? | Snyk hooks, CI | `.githooks/snyk.conf`, the guide |
