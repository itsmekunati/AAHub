---
name: release-ready
description: Go/no-go check of the frontend before a release - clean install, type check, lint, tests and build, lint hook on all files, Snyk if turned on, a scan of the built bundle for mock code, secrets and environment values, accessibility, E2E, and blocking open questions - reported as READY, NOT READY or READY WITH RISKS. Use this when the user asks whether the UI is ready to release or deploy.
disable-model-invocation: true
---

# Release readiness (frontend)

Report only: change no files, and fix nothing without asking. Severity comes from the `react-ui-kit:sprint-rubric` skill. If something does not exist yet (E2E, CI, the generated client), report it as **not built**, not as passed.

## 1. Build and checks
- `git status` is clean and the branch is up to date with its base (`git log HEAD..<base>` is empty).
- `npm ci`, then `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`.
- `bash .githooks/pre-commit --all`.
- Snyk: run `bash .githooks/pre-push` as well. The two hook scripts run Snyk only when it is turned on, and their output says whether it ran; read `.githooks/snyk.conf` for the team default. Never run `git config` to check or change Snyk settings, turn it on or sign in (the protect-files hook refuses it).

## 2. The built bundle (`dist/`)
Search the built files for:
- mock code: `msw`, `mockServiceWorker`, mock handlers, mock auth personas; `dist/mockServiceWorker.js` must not exist;
- `localhost`, `127.0.0.1`, `example.test`, test domains, issuer URLs and environment hostnames;
- anything that looks like a secret, key or token;
- `localStorage` or `sessionStorage` used for tokens or personal data.

## 3. Runtime configuration
- `public/config.json` has only safe local defaults; real environments supply their own at deploy time (`runtime-config.md`).
- No environment-specific values in `src/`.

## 4. Accessibility and behaviour
- Every page test runs axe; list any page without one.
- E2E (`e2e/`, Playwright): run it if it exists, otherwise report **not built**.
- Run the `react-ui-kit:a11y-audit` skill on the screens changed since the last release, and include its high and critical findings.

## 5. Loose ends
- Release notes: offer the `react-ui-kit:changelog` skill for the same range.
- `docs/open-questions.md`: list open items that block or affect this release.
- `TODO`, `FIXME` and `VERIFY` markers in `src/`.
- Sprints whose `implementation-status.json` is `needs-decision`, `contract-mismatch` or `blocked`.
- `npm outdated` for the design system package, React and React Router (report only).

## 6. Report

| Check | Result | Evidence |
|---|---|---|
| ... | pass / fail / not built / skipped | command and key output |

Verdict on the last line:
- **NOT READY** if any check failed or any critical or high issue was found;
- **READY WITH RISKS** if everything passed but something is not built, was skipped or has an open question;
- **READY** otherwise.
