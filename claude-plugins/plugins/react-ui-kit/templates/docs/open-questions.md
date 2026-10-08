# Open questions

Decisions still to be made. **Agents must ask rather than guess** when a task depends on any of these.

When a question is answered: record the decision in the matching rule file under `.claude/rules/` (or in `CLAUDE.md` for commands), then delete it from this list (the `react-ui-kit:record-decision` skill does this). Do not renumber rows: other files refer to them by number.

| # | Question | Affects | Where to record the answer |
|---|---|---|---|
| 1 | Which roles exist, and what may each one do and see (permission matrix)? | Every page, role visibility, E2E | the project's auth rule |
| 2 | Sign-in: issuer URL and client ID per environment, which claim carries the roles, and which OIDC library? | `src/auth/` | the project's auth rule |
| 3 | Which design system does the UI use, and how is it installed and updated? | Every component and page | the project's design system rule |
| 4 | Who reviews the backend's spec-sync PRs in this repo, and does a breaking change block deployment until it's addressed? | Spec-sync process | `api-client.md` |
| 5 | How is the built app served, and do the UI and API share an origin through OpenShift routes? | Deployment, API base URL, CORS | `deploy.md` |
| 6 | Adopt a code formatter (e.g. Prettier) alongside ESLint? | Formatting, CI | `code-style.md` |
| 7 | Snyk: the checks are built in but **off by default**. Which Snyk organisation and plan will the team use, should the team default be switched on later, and is the Snyk code check (which uploads source code to Snyk) approved? | Snyk hooks, CI | `.githooks/snyk.conf` |

<!-- Add this application's own open questions below, continuing the numbering. -->
