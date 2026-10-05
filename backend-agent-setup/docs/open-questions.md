# Open questions

Decisions still to be made. **Agents must ask rather than guess** when a task depends on any of these.

When a question is answered: record the decision in the matching rule file under `.claude/rules/`, then delete it from this list.

| # | Question | Affects | Rule file to update |
|---|---|---|---|
| 1 | Internal email domains (User Role Management): gov.uk, Forestry and Nature domains are internal. What are the exact Forestry and Nature domains, do subdomains count (e.g. any `*.gov.uk`), and is the list the same in every environment? Which domains are internal in the test environment? | Classification, tests | `user-classification.md` |
| 2 | OpenDJ schema: how are internal vs external users and roles modelled (OUs, groups, custom object classes)? Is it accessed over LDAPS? Which OpenDJ distribution and version runs in production (the test container must match it)? | LDAP gateway | `ldap.md` |
| 3 | What does the Futures Database schema for user details and provisioning look like? | Entities, migrations | `futures-db.md` |
| 4 | Which S3 bucket/prefix, and which AWS account? | Shipping job | `log-shipping.md` |
| 5 | How often does the S3 shipping scheduler run (once shortly after each cutover, or more frequently as a safety margin)? | Shipping job | `log-shipping.md` |
| 6 | Does the local log directory need a persistent volume, given pods can be rescheduled before that day's file is shipped? | Shipping, deployment | `log-shipping.md`, `deploy.md` |
| 7 | What may `admin` and `editor` each do (permission matrix)? Can an `editor` create external users, or assign roles? (`viewer` is decided: read-only, see `security-okta.md`.) | Every endpoint | `security-okta.md` |
| 8 | Okta: org and authorization server (issuer), client ID and audience, and which claim carries the `admin`/`editor`/`viewer` roles (for example a `groups` claim or a custom claim)? Who manages the Okta configuration? | Security config | `security-okta.md` |
| 9 | Failure strategy when one of OpenDJ/Futures Database succeeds and the other fails: which is written first? | Provisioning flow | `provisioning.md` |
| 10 | What credential does the spec-sync workflow use to trigger the frontend repo (a GitHub App installation scoped to that repo is preferred)? Who reviews the resulting frontend PRs? | CI | `deploy.md`, `api-contract.md` |
| 11 | Do the UI and API share an origin through OpenShift routes, or are they on different origins (needing CORS)? How is the UI served in ROSA? | CORS, routing | `api-contract.md`, `security-okta.md` |
| 12 | S3 in tests: LocalStack's Docker image has required an account auth token since March 2026. Does the team have an approved LocalStack token for local and CI use, or should S3 tests use a mocked S3 client (or another token-free S3 emulator)? | S3 shipping tests | `testing.md`, `test-infrastructure` skill |
| 13 | Java code style, formatter and linter: e.g. Spotless with Palantir or Google Java Format, and Checkstyle (the pre-commit lint hook runs Checkstyle once it is configured in `pom.xml`)? | Formatting, lint hook, CI | `code-style.md` |
| 14 | **Decided:** a pre-commit lint hook (`.githooks/pre-commit`, plain Git hooks). **Still open:** any other checks before commit or push (secrets scanning, blocking `.env`/keys/log files, commit message format, formatting, tests before push; not before commit, because TDD commits failing tests), whether to adopt a hook manager (e.g. Lefthook, pre-commit, Husky), and whether agents get Claude Code hooks that block bypassing the checks and `git push`. | Every commit, the Generator and Evaluator, CI | `.githooks/`, `CLAUDE.md`, the guide |
| 15 | Snyk: the checks are built in but **off by default**. Which Snyk organisation and plan will the team use, should the team default be switched on later, and is the Snyk code check (which uploads source code to Snyk) approved? | Snyk hooks, CI | `.githooks/snyk.conf`, the guide |
| 17 | JSM/Jira ticket: what is its exact format, and is it checked against JSM (does the ticket exist, is it open) or only for presence? | Every transaction | `transactions.md` |
| 18 | Transaction ID: what format should it take (for example a UUID or a prefixed sequence)? | Every transaction, audit | `transactions.md` |
| 19 | User identifier and manager X number: what are the exact formats of U, Z, GAKWO and X identifiers, and is the identifier kind tied to the user type? Is the manager X number retrieved with the user's record or supplied by the operator? | Provisioning validation, user look-up | `transactions.md` |
| 20 | UI audit events: is recording UI-only events (journey started or cancelled, client-side validation, on-screen errors) required by security or compliance, and is the list of events right? | Audit endpoint, log volume | `audit-logging.md` |
| 16 | User Provisioning is for internal users only. Should the backend also reject a provisioning request whose email address is not on an internal domain, or is the user type (Government, Forestry, Nature) enough? | Provisioning validation | `user-classification.md` |
