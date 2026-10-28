---
name: release-ready
description: Go/no-go check of the whole application before a release - full Maven build with container tests in av-service/, clean install, lint, tests and build in av-ui/, lint hook on all files, Snyk if turned on, migrations, a scan of the built bundle for mock code, secrets and environment values, accessibility, E2E, operations settings and blocking open questions - reported as READY, NOT READY or READY WITH RISKS. Use this when the user asks whether the application is ready to release or deploy.
disable-model-invocation: true
---

# Release readiness

Report only: change no files, and fix nothing without asking. Severity comes from the `angularjs-micronaut-kit:sprint-rubric` skill. Never touch a real environment: everything runs locally or against Testcontainers. If something does not exist yet (E2E, CI, `deploy/`, a migration tool), report it as **not built**, not as passed.

## 1. Build and checks
- `git status` is clean and the branch is up to date with its base (`git log HEAD..<base>` is empty).
- `av-service/`: `./mvnw clean verify` (needs Docker for the container tests; if Docker is unavailable, report **skipped**, not passed).
- `av-ui/`: `npm ci`, then `npm run lint`, `npm test` and `npm run build`.
- `bash .githooks/pre-commit --all`.
- Snyk: run `bash .githooks/pre-push` as well. The two hook scripts run Snyk only when it is turned on, and their output says whether it ran; read `.githooks/snyk.conf` for the team default. Never run `git config` to check or change Snyk settings, turn it on or sign in (the protect-files hook refuses it).

## 2. Backend: data and operations
- Migrations since the last release are new files, additive, in order, and none that was already released has been changed.
- The application starts against the migrated schema (covered by the integration tests).
- `application*.yml`: no secrets, hosts, credentials or environment-specific names; all come from environment variables or Secrets.
- Health endpoints (`/health`, and liveness and readiness if configured) are present.
- `av-service/Dockerfile` (if present): non-root user, works with an arbitrary UID, non-privileged port, pinned base image.

## 3. Frontend: the built bundle
Search the built files (for example `av-ui/dist/`) for:
- mock code: `ngMockE2E`, `$httpBackend`, mock data, scenario names;
- `localhost`, `127.0.0.1`, `example.test`, test domains and environment hostnames;
- anything that looks like a secret, key or token;
- `localStorage` or `sessionStorage` used for personal data.

Then check the runtime configuration: the committed configuration file has only safe local defaults, real environments supply their own at deploy time (`runtime-config.md`), and there are no environment-specific values in `av-ui/src/`.

## 4. Accessibility and behaviour
- Every component test that renders a screen runs axe; list any without one.
- E2E (`av-ui/e2e/`, Playwright): run it if it exists, otherwise report **not built**.
- Run the `angularjs-micronaut-kit:a11y-audit` skill on the screens changed since the last release, and include its high and critical findings.

## 5. Loose ends
- Release notes: offer the `angularjs-micronaut-kit:changelog` skill for the same range.
- `docs/open-questions.md`: list open items that block or affect this release.
- `TODO`, `FIXME` and `VERIFY` markers in `av-service/src/` and `av-ui/src/`.
- Sprints whose `implementation-status.json` is `needs-decision` or `blocked`.
- Dependencies the Micronaut BOM does not manage, and `npm outdated` for AngularJS and the design system package (report only).

## 6. Report

| Check | Result | Evidence |
|---|---|---|
| ... | pass / fail / not built / skipped | command and key output |

Then list the endpoints changed since the last release and the configuration or Secrets the environments need (names only).

Verdict on the last line:
- **NOT READY** if any check failed or any critical or high issue was found;
- **READY WITH RISKS** if everything passed but something is not built, was skipped or has an open question;
- **READY** otherwise.
