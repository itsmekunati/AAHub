# Open questions

Decisions still to be made. **Agents must ask rather than guess** when a task depends on any of these.

When a question is answered: record the decision in the matching rule file under `.claude/rules/`, then delete it from this list (the `springboot-api-kit:record-decision` skill does this). Do not renumber rows: other files refer to them by number.

| # | Question | Affects | Rule file to update |
|---|---|---|---|
| 1 | What does the database schema look like, and which engine and version runs in production (the test container must match it)? | Entities, migrations | `persistence.md` |
| 2 | Which roles exist, and what may each one do (permission matrix)? | Every endpoint | the project's security rule |
| 3 | Identity provider: issuer, audience, and which claim carries the roles? Who manages that configuration? | Security config | the project's security rule |
| 4 | Do the UI and API share an origin through OpenShift routes, or are they on different origins (needing CORS)? | CORS, routing | `api-contract.md` |
| 5 | What credential does the spec-sync workflow use to trigger the frontend repo (a GitHub App installation scoped to that repo is preferred)? Who reviews the resulting frontend PRs? | CI | `deploy.md`, `api-contract.md` |
| 6 | Java code style, formatter and linter: e.g. Spotless with Palantir or Google Java Format, and Checkstyle (the pre-commit lint hook runs Checkstyle once it is configured in `pom.xml`)? | Formatting, lint hook, CI | `code-style.md` |
| 7 | Snyk: the checks are built in but **off by default**. Which Snyk organisation and plan will the team use, should the team default be switched on later, and is the Snyk code check (which uploads source code to Snyk) approved? | Snyk hooks, CI | `.githooks/snyk.conf` |

<!-- Add this application's own open questions below, continuing the numbering. -->
