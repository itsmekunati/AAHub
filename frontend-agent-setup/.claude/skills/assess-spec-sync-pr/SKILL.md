---
name: assess-spec-sync-pr
description: Procedure for assessing a backend spec-sync pull request (changes to openapi/openapi.json and src/services/api/generated/) against the UI, identifying added, changed and removed operations and fields, affected screens, and breaking changes, and proposing a remediation sprint. Use this whenever the OpenAPI spec changes or someone asks whether a backend change affects the UI.
---

# Assess a spec-sync pull request

Relevant rule: `.claude/rules/api-client.md`.

## 1. Diff the spec
- Compare `openapi/openapi.json` with the previous commit on `main`.
- List, per operation: added, removed, and changed paths/methods; request fields added, removed, renamed or made required; response fields added, removed or renamed; status codes and error shape changes; validation changes.

## 2. Check generated types are consistent
- Run `npm run api:generate` and confirm it produces no further diff.

## 3. Find what the UI uses
- Search `src/services/` for each changed operation, then the pages and components that use those services.

## 4. Classify
- **Breaking for the UI**: anything the UI sends or reads that was removed, renamed, retyped or newly required; changed status codes or error shape the UI relies on.
- **Non-breaking**: additions the UI does not use yet.
- **Opportunity**: new operations or fields a planned feature could use.

## 5. Report
- A short table: change, affected files/screens, breaking yes/no, suggested fix.
- If anything is breaking, propose a remediation sprint (acceptance criteria per affected screen) for the Planner to run through the normal loop.
- Run `npm run typecheck` on the PR branch; type errors are strong evidence of breaking changes.
