# Open questions

Decisions still to be made. **Agents must ask rather than guess** when a task depends on any of these.

When a question is answered: record the decision in the matching rule file under `.claude/rules/` (or in `CLAUDE.md` for commands), then delete it from this list.

| # | Question | Affects | Where to record the answer |
|---|---|---|---|
| 1 | What may `admin` and what may `editor` each do (permission matrix)? Which parts of the UI should each role see? (`viewer` is decided: read-only, see `auth.md`.) | Every page, role visibility, E2E | `auth.md` |
| 2 | Okta details: issuer URL (org and authorization server) and client ID per environment, and which claim carries the roles. Which OIDC library: `@okta/okta-auth-js` or a standard OIDC client? | `src/auth/` | `auth.md` |
| 3 | Who reviews the backend's spec-sync PRs in this repo, and does a breaking change block deployment until it's addressed? | Spec-sync process | `api-client.md` |
| 4 | How is the built app served in ROSA, and do the UI and API share an origin through OpenShift routes? | Deployment, API base URL, CORS | `deploy.md` |
| 5 | **Decided:** a pre-commit lint hook (`.githooks/pre-commit`, plain Git hooks) running ESLint, a Prettier check, yamllint and Hadolint. **Still open:** any other checks before commit or push (secrets scanning, blocking `.env`/keys/Playwright session files, blocking hand-edits to `openapi/` and generated types, commit message format, type check/tests before push; not before commit, because TDD commits failing tests), whether to adopt a hook manager (e.g. Lefthook, pre-commit, Husky with lint-staged), and whether agents get Claude Code hooks (block bypassing and `git push`, lint each file after editing). | Every commit, the Generator and Evaluator, CI | `.githooks/`, `CLAUDE.md`, the guide |
| 6 | Snyk: the checks are built in but **off by default**. Which Snyk organisation and plan will the team use, should the team default be switched on later, and is the Snyk code check (which uploads source code to Snyk) approved? | Snyk hooks, CI | `.githooks/snyk.conf`, the guide |
