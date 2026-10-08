---
name: api-contract-diff
description: Generate the OpenAPI spec for the current code and for a base ref (main or the last release tag), compare them structurally, and classify every change as breaking or non-breaking for the frontend. Use this whenever a change touches api/, exception/ or DTOs, when reviewing or preparing a pull request, before a release, or when someone asks whether a change will break the UI.
argument-hint: "[base ref, default main]"
---

# API contract diff

Relevant rule: `.claude/rules/api-contract.md`. Read-only: never hand-edit `openapi.json`; change the code and regenerate it.

## 1. Generate the current spec
- `./mvnw clean verify`. The springdoc Maven plugin writes `openapi.json` during the integration-test phase (find the output path in `pom.xml`).
- If there is no `pom.xml` or the plugin is not configured yet, report **not built** and stop.
- If the build fails, report it; a spec from a failing build is not evidence.

## 2. Generate the base spec
- Base: the argument, otherwise `main`; for a release, the latest tag.
- `git worktree add <temp dir> <base>`, run the same build there, copy its `openapi.json`, then `git worktree remove <temp dir>`.
- If the base has no spec (the first release), report every operation as **new**.

## 3. Compare structurally
Compare the parsed JSON, not the text. For each operation (path + method), and each schema it uses:
- operations added or removed;
- request: fields added, removed, renamed, retyped; newly required; enum values removed; validation tightened (`minLength`, `maxLength`, `pattern`, `format`);
- response: fields removed, renamed or retyped; fields that became optional or nullable; enum values added;
- status codes added or removed, and the error response shape;
- security: roles or scopes changed.

## 4. Classify for the UI
- **Breaking:** an operation removed or renamed; a request field removed, renamed, retyped or newly required; validation tightened; a response field the UI could read removed, renamed, retyped or made optional; a status code or the error shape changed; a new enum value in a response the UI switches on.
- **Non-breaking:** new operations; new optional request fields; new response fields; documentation-only changes.
- For each breaking change, suggest an additive alternative (keep the old field, add the new one, deprecate later).

## 5. Report
Three tables (breaking, non-breaking, documentation only): operation, change, why it is or is not breaking, and the frontend impact. End with **breaking: yes/no**. If yes, the change must be flagged in the commit body and the PR, and the frontend team needs to know before the spec-sync PR arrives.
