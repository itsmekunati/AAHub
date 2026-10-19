# Wiring the UI to openapi.json

How to replace the UI's hand-written TEMPORARY API contract with types generated from the backend's `openapi.json`, using Claude Code directly (no Planner, Generator or Evaluator agents). Each step names who does it and gives the prompt to paste into Claude.

## Who does what

Three people are involved: the **UI developer** (this repo), the **backend developer** (the backend repo) and **DevOps** (CI, credentials, deployment). Claude works only in the UI repo, on behalf of the UI developer.

| Step | Owner | Supports | Output |
| --- | --- | --- | --- |
| Generate and hand over `openapi.json` | Backend developer | — | The spec file from `./mvnw clean verify` |
| 0. Bring the spec into the UI repo | UI developer | — | `spec-sync/initial` branch with `openapi/openapi.json` |
| 1. Set up the type generator | UI developer (with Claude) | — | `api:generate` / `api:update` scripts, generated types |
| 2. Assess the spec against the UI | UI developer (with Claude) | Backend developer answers questions | Placeholder-to-operation table, list of gaps |
| Add missing endpoints | Backend developer | UI developer describes the need | New spec version |
| 3. Replace the temporary contract | UI developer (with Claude) | — | `feature/use-generated-api` branch |
| 4. Verify | UI developer (with Claude) | — | Passing checks, mock API walk-through |
| 5. Push and open PRs | UI developer | — | Two PRs |
| Review the spec-sync PR | UI developer | Backend developer | Approved spec PR |
| Review the feature PR | Another UI developer | — | Approved UI PR |
| CI check that generated types match the spec | DevOps | UI developer | Workflow in `.github/workflows/` |
| Spec-sync workflow (backend opens PRs here automatically) | DevOps | Backend developer | Backend workflow + GitHub App or fine-grained PAT scoped to this repo |
| Deploy, API base URL, routes and CORS on ROSA | DevOps | UI and backend developers | Deployment config (open question #3) |

Who reviews spec-sync PRs, and whether a breaking change blocks deployment, is still open question #2 in [open-questions.md](open-questions.md). The table above assumes the UI developer approves with the backend developer reviewing.

### What Claude can't do

The repo's hooks stop Claude from:

- writing to `openapi/` or `src/services/api/generated/`, apart from what `npm run api:generate` creates;
- hand-editing `package-lock.json` (it changes only through `npm install`);
- running `git push`, or editing `.claude/settings.json`, hooks, `.githooks/`, `.github/workflows/` or `deploy/`.

Edits to `package.json`, `CLAUDE.md`, `.claude/rules/` and `docs/` ask the UI developer for approval each time. Workflow and deployment changes are DevOps work.

## Before you start

**Backend developer**

- [ ] Run `./mvnw clean verify` in the backend repo and share the generated `openapi.json` (the output path is in the backend's `pom.xml`). A running backend also serves it at `http://localhost:8080/v3/api-docs`.
- [ ] Confirm the spec documents the error responses, required fields and allowed roles for each operation.

**UI developer**

- [ ] The UI repo is on `main` with no uncommitted changes (`git status`), and `npm install` has been run.
- [ ] `npm test` and `npm run e2e` pass on `main`, so any new failure comes from this change.
- [ ] Claude Code is opened in this repo's root folder. Its `CLAUDE.md`, rules, skills and hooks only load from there.

## Step 0: bring the spec in

**Owner: UI developer.** Run these yourself. Claude can't create files under `openapi/`, and the commit hook only accepts spec changes on a `spec-sync/` branch.

```bash
git checkout main
git pull
git checkout -b spec-sync/initial
mkdir openapi
cp <path-to-backend>/openapi.json openapi/openapi.json
```

Don't edit the file. If something in it is wrong, the backend developer fixes the backend code and generates it again.

## Step 1: set up the generator

**Owner: UI developer, with Claude.** The repo's docs mention `npm run api:generate`, but the script and the generator package aren't installed yet.

Prompt:

```text
openapi/openapi.json is in place on the spec-sync/initial branch. Set up type generation:
install openapi-typescript as a dev dependency, add the api:generate and api:update scripts
to package.json (api:generate writes src/services/api/generated/schema.ts; api:update fetches
http://localhost:8080/v3/api-docs first), then run npm run api:generate. Don't change any
other code yet. Tell me what to commit.
```

Claude will:

1. run `npm install -D openapi-typescript`;
2. ask you to approve the `package.json` edit that adds the two scripts;
3. run `npm run api:generate` and confirm `npm run typecheck` still passes.

Then commit:

```bash
git add openapi src/services/api/generated package.json package-lock.json
git commit -m "chore(spec-sync): initial API contract"
```

If the hook blocks `npm run api:generate`, run it yourself and tell Claude it's done.

## Step 2: assess the spec (read-only)

**Owner: UI developer, with Claude. Supports: backend developer.** Before any code changes, Claude matches each placeholder call to a real operation. Anything the spec doesn't cover goes to the backend developer. Claude must not make it up.

Prompt:

```text
Following the assess-spec-sync-pr skill and .claude/rules/api-client.md, compare
openapi/openapi.json with the TEMPORARY contract in src/services/ and src/mocks/.
For each placeholder call, give me the matching operation (method, path, operationId)
and any field differences. Also check the user-type codes, the error body shape,
and the Jira ticket / transactionId fields. List anything missing as a backend
dependency. Read-only: don't change any files.
```

Fill this in from Claude's report:

| Placeholder in the UI | File | Real operation | Status |
| --- | --- | --- | --- |
| `GET /locations?userType=` | `provisioning.ts` | | |
| `GET /users/{id}` (directory look-up) | `provisioning.ts` | | |
| `GET /existing-users?userType=SNH&…` | `provisioning.ts` | | |
| `POST` provisioning request | `provisioning.ts` | | |
| `GET /users/{id}/ldap-groups` | `roleManagement.ts` | | |
| `GET` LDAP group catalogue | `roleManagement.ts` | | |
| `POST` role-change request | `roleManagement.ts` | | |
| `POST` audit event | `auditEvents.ts`, `audit.ts` | | |

Also check:

- the user-type codes `SG`, `SNH`, `FGS` and `public` match the spec's enums;
- the error body matches what `problemMessage.ts` reads;
- every transaction sends the Jira ticket and gets a `transactionId` back (`.claude/rules/transactions.md`).

If something is missing, leave that placeholder in place and marked TEMPORARY. The UI developer sends the request to the backend developer, who can give it to the backend Planner, for example: "Add an endpoint to look up existing NatureScot users by GAKWO and email." The UI continues once the new spec arrives.

Prompt to write that request:

```text
What exactly is missing from the spec for this? Write it as a request to the backend developer.
```

## Step 3: replace the temporary contract

**Owner: UI developer, with Claude.** Do this on its own branch, after the spec-sync PR is merged (or branched from `spec-sync/initial` if it's still in review).

```bash
git checkout main
git pull
git checkout -b feature/use-generated-api
```

Prompt:

```text
Using the assessment above, replace the TEMPORARY contract with the generated types in
src/services/api/generated/schema.ts. Work test-first with the tdd-cycle skill and follow
the add-api-call skill. Update the services, the MSW mocks and their tests to use the real
paths and generated types, and keep the empty, forbidden and serverError scenarios.
Leave any operation that is missing from the spec as TEMPORARY and list it. Then
remove the temporary-contract exception from .claude/rules/api-client.md. Commit in small
steps, failing test first.
```

What changes:

| Area | Files | Change |
| --- | --- | --- |
| Services | `src/services/provisioning.ts`, `roleManagement.ts`, `auditEvents.ts`, `audit.ts` | Generated types replace the hand-written ones; real paths replace the placeholders; `unknown` is narrowed instead of cast with `as` |
| Errors | `src/services/problemMessage.ts` | Reads the documented error shape |
| Mock API | `src/mocks/handlers.ts`, `auditHandlers.ts`, `data.ts` | Real paths and generated types; scenarios kept |
| Tests | `src/services/*.test.ts`, `src/mocks/handlers.test.ts`, page tests | Updated first, so they fail against the old shape |
| Rules | `.claude/rules/api-client.md` | Temporary-contract exception and placeholder-path notes removed (you approve) |

The pages shouldn't need changes. Exports like `USER_TYPES` and `ROLE_USER_TYPES` keep their names unless the spec renames the codes.

## Step 4: verify

**Owner: UI developer, with Claude.**

Prompt:

```text
Verify the change: run typecheck, lint, the unit tests and the e2e tests. Build for
production and search dist/ for mock code. Run the app with the mock API and walk through
the provisioning and User Role Manager journeys as an editor and as a viewer, including
the empty, forbidden and serverError scenarios. Confirm git diff touches nothing under
openapi/, src/services/api/generated/, .claude/settings*, hooks or workflows. Report
anything that failed.
```

Checks:

- [ ] `npm run typecheck`, `npm run lint`, `npm test` and `npm run e2e` all pass.
- [ ] `npm run build` passes, and `dist/` contains no mock handlers, mock data or `mockServiceWorker.js`.
- [ ] `npm run dev` (mock API): each journey works as an editor; a viewer sees only User Role Manager and Check access.
- [ ] A keyboard-only run-through of each changed page.
- [ ] Optional: `npm run dev:api` against a locally running backend (the backend developer can help start it).

## Step 5: push and open the PRs

**Owner: UI developer.** There are two PRs, merged in this order:

1. **`spec-sync/initial`**: the spec, the generated types and the generator scripts. The backend developer reviews it to confirm it's the right spec version.
2. **`feature/use-generated-api`**: the UI changes, reviewed by another UI developer. Ask Claude for the description: "Write a PR description using the create-pr skill."

```bash
git push -u origin spec-sync/initial
git push -u origin feature/use-generated-api
```

In the feature PR, list any operations still marked TEMPORARY and the backend dependency each one is waiting on.

## Later spec changes

**Until the spec-sync workflow exists:** the backend developer shares the new `openapi.json`, and the UI developer repeats Steps 0–4 on a smaller branch, for example `spec-sync/2026-11-02`. Copy the new file over `openapi/openapi.json`, run `npm run api:generate`, commit, then:

```text
openapi/openapi.json has changed. Following the assess-spec-sync-pr skill, diff it against
main and tell me the added, changed and removed operations and fields, which screens they
affect, and which changes are breaking. Don't change code yet.
```

Then use the Step 3 prompt for only the affected parts.

**Once DevOps has set up the spec-sync workflow:** on each merge to the backend's `main`, the workflow opens a spec PR in this repo. Step 0 goes away; the UI developer runs the assessment prompt on that PR branch and fixes the UI before merging.

## Prompt cheat sheet

Short versions for the UI developer. The full prompts are above.

| When | Say to Claude |
| --- | --- |
| Spec copied in | "openapi/openapi.json is in place. Set up openapi-typescript, the api:generate and api:update scripts, and generate the types. Don't change other code." |
| Generated | "Assess openapi/openapi.json against the TEMPORARY contract. Read-only, list the gaps." |
| Assessment agreed | "Replace the TEMPORARY contract with the generated types, test-first. Keep the mock scenarios." |
| Code done | "Verify: typecheck, lint, unit, e2e, production build check, mock API walk-through as editor and viewer." |
| PR | "Write a PR description using the create-pr skill." |
| Spec updated later | "openapi/openapi.json changed. Assess the diff and the breaking changes. Don't change code yet." |
| A page needs a missing endpoint | "What exactly is missing from the spec for this? Write it as a request to the backend developer." |

## Troubleshooting

| Symptom | Cause | What to do | Who |
| --- | --- | --- | --- |
| "Protected (never edit)" when Claude touches `openapi/` or `generated/` | The hook in `.claude/hooks/protect-files.sh` | Run that command yourself, then tell Claude it's done | UI developer |
| Commit rejected for spec files | Not on a `spec-sync/` branch | `git checkout -b spec-sync/<name>` and commit there | UI developer |
| Claude says `CONTRACT-MISMATCH` or "not in the spec" | The UI needs something the backend doesn't publish | Keep the placeholder; request the endpoint; continue once the new spec arrives | UI → backend developer |
| `api:generate` fails | The spec is invalid or not OpenAPI 3.x | Fix it in the backend code and regenerate. Don't hand-fix the JSON | Backend developer |
| Typecheck fails across many pages | Generated names differ from the old exports | Ask Claude to keep the old export names as aliases in the services, so pages stay unchanged | UI developer |
| Tests pass locally but the real backend fails | Mocks drifted from the spec | Ask Claude to check every handler in `src/mocks/` against `openapi/openapi.json` | UI developer |
| CI passes with stale generated types | No drift check in CI yet | Add a workflow that runs `npm run api:generate` and fails on a diff | DevOps |
| UI can't reach the API once deployed | Base URL, routes or CORS on ROSA | Agree routes and origin (open question #3) | DevOps |
