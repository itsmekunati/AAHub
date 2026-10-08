---
name: release-ready
description: Go/no-go check of the backend before a release - full Maven build with container tests, lint hook on all files, Snyk if turned on, API contract diff and breaking changes, migrations, security and audit configuration, health endpoints, container image settings and blocking open questions - reported as READY, NOT READY or READY WITH RISKS. Use this when the user asks whether the API is ready to release or deploy.
disable-model-invocation: true
---

# Release readiness (backend)

Report only: change no files, and fix nothing without asking. Severity comes from the `springboot-api-kit:sprint-rubric` skill. Never touch a real environment: everything runs locally or against Testcontainers. If something does not exist yet (CI, `deploy/`, a migration tool), report it as **not built**, not as passed.

## 1. Build and checks
- `git status` is clean and the branch is up to date with its base (`git log HEAD..<base>` is empty).
- `./mvnw clean verify` (needs Docker for the container tests; if Docker is unavailable, report **skipped**, not passed).
- `bash .githooks/pre-commit --all`.
- Snyk: run `bash .githooks/pre-push` as well. The two hook scripts run Snyk only when it is turned on, and their output says whether it ran; read `.githooks/snyk.conf` for the team default. Never run `git config` to check or change Snyk settings, turn it on or sign in (the protect-files hook refuses it).

## 2. API contract
- Run the `springboot-api-kit:api-contract-diff` skill against the last release (the latest tag, or the first commit if there are no tags).
- Confirm every breaking change it finds was flagged in its commit and PR.

## 3. Data
- Migrations since the last release are new files, additive, in order, and none that was already released has been changed.
- The context starts with `ddl-auto: validate` against the migrated schema (covered by the build).

## 4. Security, audit and operations
- Every controller method declares its roles; no endpoint is public except the Actuator health endpoints.
- If the project has an audit log: every auditable action has audit tests for success and failure, and the audit logger and its rolling policy are configured.
- `application*.yml`: no secrets, hosts, credentials or environment-specific names; all come from environment variables or Secrets.
- Actuator liveness and readiness endpoints are present.
- `Dockerfile` (if present): non-root user, works with an arbitrary UID, non-privileged port, pinned base image.

## 5. Loose ends
- Release notes: offer the `springboot-api-kit:changelog` skill for the same range.
- `docs/open-questions.md`: list open items that block or affect this release.
- `TODO`, `FIXME` and `VERIFY` markers in `src/`.
- Sprints whose `implementation-status.json` is `needs-decision`, `contract-mismatch` or `blocked`.
- Dependencies Spring Boot does not manage, and their versions (report only).

## 6. Report

| Check | Result | Evidence |
|---|---|---|
| ... | pass / fail / not built / skipped | command and key output |

Then list the breaking API changes and the configuration or Secrets the environments need (names only).

Verdict on the last line:
- **NOT READY** if any check failed or any critical or high issue was found;
- **READY WITH RISKS** if everything passed but something is not built, was skipped or has an open question;
- **READY** otherwise.
