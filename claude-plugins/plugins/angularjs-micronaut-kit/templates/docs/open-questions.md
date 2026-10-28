# Open questions

Decisions still to be made. **Agents must ask rather than guess** when a task depends on any of these.

When a question is answered: record the decision in the matching rule file under `.claude/rules/` (or in `CLAUDE.md` for commands), then delete it from this list (the `angularjs-micronaut-kit:record-decision` skill does this). Do not renumber rows: other files refer to them by number.

| # | Question | Affects | Where to record the answer |
|---|---|---|---|
| 1 | What does the database schema look like, and which engine and version runs in production (the test container must match it)? Micronaut Data JDBC or JPA? | Entities, migrations | `persistence.md` |
| 2 | Backend build and test tooling: Maven or Gradle; explicit Testcontainers or Micronaut Test Resources? | Commands, test infrastructure | `backend-code-style.md`, `CLAUDE.md` "Commands" |
| 3 | What is the error response shape for `4xx` and `5xx` (Micronaut's default or a project-specific record)? | Exception handlers, every frontend service and mock | `backend-code-style.md` |
| 4 | Frontend tooling: exact AngularJS version, router (ngRoute or ui-router), and build tool (webpack, gulp or plain script tags)? | Commands, test set-up, mock backend loading | `frontend-code-style.md`, `CLAUDE.md` "Commands" |
| 5 | Which design system does the UI use, and how is it installed and updated? | Every component and page | the project's design system rule |
| 6 | How is the built UI served, and do the UI and API share an origin through OpenShift routes (or need CORS)? Are both always released together? | Deployment, API base URL, CORS | `deploy.md` |
| 7 | Code style, formatter and linter: Checkstyle (and a formatter such as Spotless) for Java; ESLint rules (and `eslint-plugin-angular`, Prettier) for JavaScript? | Formatting, lint hook, CI | `backend-code-style.md`, `frontend-code-style.md` |
| 8 | Snyk: the checks are built in but **off by default**. Which Snyk organisation and plan will the team use, should the team default be switched on later, and is the Snyk code check (which uploads source code to Snyk) approved? | Snyk hooks, CI | `.githooks/snyk.conf` |

<!-- SETUP: add this application's own open questions below, continuing the numbering. Sign-in and roles are not covered by this kit: if the application needs them, add a question for each. -->
