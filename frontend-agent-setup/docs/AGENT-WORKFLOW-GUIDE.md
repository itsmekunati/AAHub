# Multi-Agent Build Workflow (Frontend): Step-by-Step Guide

This guide explains how to use the **Planner**, **Generator** and **Evaluator** agents to build features in the user-provisioning React UI. It is written so that someone new to the repository, or to Claude Code, can follow it from start to finish.

The backend repository has its own copy of these agents and its own guide. The two work the same way, but each repository's agents only see and change their own repository.

**Contents**

1. [What this is](#1-what-this-is)
2. [How project knowledge is organised](#2-how-project-knowledge-is-organised)
3. [Test-driven development (TDD)](#3-test-driven-development-tdd)
4. [Prerequisites](#4-prerequisites)
5. [One-time set-up](#5-one-time-set-up)
6. [Running a build cycle](#6-running-a-build-cycle)
7. [Building the UI: first steps and adding pages](#7-building-the-ui-first-steps-and-adding-pages)
8. [Using Git worktrees](#8-using-git-worktrees)
9. [Snyk security checks (off by default)](#9-snyk-security-checks-off-by-default)
10. [When the backend's API changes](#10-when-the-backends-api-changes)
11. [When things go wrong](#11-when-things-go-wrong)
12. [Rules everyone should know](#12-rules-everyone-should-know)
13. [File reference](#13-file-reference)
14. [Troubleshooting Claude Code](#14-troubleshooting-claude-code)

---

## 1. What this is

Instead of asking one AI assistant to "just build the screen", the work is split between three agents with separate jobs:

| Agent | Role | What it produces |
|---|---|---|
| **Planner** | Orchestrator. Turns your short request into a UI spec, checks it against the backend's API contract, splits it into sprints, runs the build loop, and asks you when a decision is needed. | `specs/product-spec.json`, `sprints/status.json`, `sprints/sprint-NN/contract.json` |
| **Generator** | Implementer. Builds one sprint at a time with the Scottish Government Design System, writes tests, commits, and self-checks its work. | Source code, tests, `implementation-status.json`, `self-eval.json` |
| **Evaluator** | Skeptical QA. Runs the checks, drives the UI in a real browser, tests accessibility, security and error handling, and grades the work. | `sprints/sprint-NN/evaluation-RR.json` |

All three follow `CLAUDE.md`, which is the **single source of truth** for the Design System, authentication, the API contract, security and working rules. If an agent file and `CLAUDE.md` disagree, `CLAUDE.md` wins. Detailed rules are split into smaller files that load only when needed; see section 2.

### How the loop works

```
You ──(1-4 sentence request)──► PLANNER
                                  │  reads openapi/openapi.json, writes spec,
                                  │  lists open questions and backend dependencies
You ──("good to go")────────────► │
                                  │  writes sprint contract
                                  ├──► GENERATOR  builds sprint, commits, writes self-eval
                                  │         │
                                  │◄────────┘  (or "NEEDS-DECISION" / "CONTRACT-MISMATCH")
                                  ├──► EVALUATOR  checks, browser testing, accessibility, grades
                                  │         │
                                  │◄────────┘  PASS or FAIL (written to a file)
                                  │
                        FAIL ─────┤ retry Generator (max 5 attempts, then "blocked")
                        PASS ─────┤ next sprint ... until all sprints are done
```

The Planner is the only agent that starts other agents. The Generator and Evaluator do their job and report back.

---

## 2. How project knowledge is organised

The project rules are split into layers, so each agent reads only what the current task needs. This is called **progressive disclosure**. It keeps the agents focused and stops long, irrelevant rules from crowding out the important ones.

| Layer | Where | When it is loaded | What goes there |
|---|---|---|---|
| 1. Core rules | `CLAUDE.md` (repository root) | Always, in every session and every agent | Overview, stack, key principles, non-negotiable rules (accessibility, tokens, secrets, API contract), commands, rules for Claude, and where to find the layers below |
| 2. Area rules | `.claude/rules/*.md` | Automatically, when an agent works on a file matching the rule's `paths:` | Detailed rules for one area: Design System, forms and accessibility, auth, API client, tests, E2E, deployment |
| 3. Procedures | `.claude/skills/<name>/SKILL.md` | When the task needs it, or preloaded into an agent | Step-by-step how-tos: `tdd-cycle`, `test-infrastructure`, `auth-integration`, `data-page`, `sg-design-system-component`, `form-with-server-errors`, `add-api-call`, `assess-spec-sync-pr`, `sprint-rubric`, `figma-to-react`, `review-code`, `commit`, `create-pr`, `release-ready`, `fix-bug`, `record-decision`, `changelog`, `a11y-audit`, `content-review` |
| 4. Reference | `docs/reference/`, `docs/open-questions.md` | Only when an agent opens the file | The accessibility checklist, and decisions still to be made |

### Rule files and when they load

| Rule file | Covers | Loads when an agent touches |
|---|---|---|
| `tdd.md` | Test-first rules: red → green → refactor, commits, evidence | `.ts`/`.tsx` files in `src/` |
| `code-style.md` | Strict TypeScript and React conventions | `.ts`/`.tsx` files, `package.json`, ESLint and `tsconfig` files |
| `design-system.md` | Using `@scottish-government/design-system`, markup, Sass, JS initialisation | `src/components/`, `src/pages/`, `src/styles/` |
| `forms-accessibility.md` | WCAG 2.2 AA, forms, error summary, screen states, content | `src/components/`, `src/pages/` |
| `auth.md` | Okta PKCE, tokens in memory, roles for visibility only | `src/auth/`, `src/services/` |
| `api-client.md` | OpenAPI contract, generated client, spec-sync, user type | `src/services/`, `openapi/` |
| `transactions.md` | Mandatory JSM/Jira ticket, separate transaction ID, mandatory provisioning fields, external users in URM | `src/pages/`, `src/services/`, `src/mocks/` |
| `ui-audit.md` | Events the UI reports, no personal data, the local `logs/ui-audit.log` | `src/pages/`, `src/services/`, `src/mocks/`, `dev/` |
| `runtime-config.md` | `config.json` settings, one build for every environment | `src/config*.ts`, `src/main.tsx`, `public/config.json`, `vite.config.*` |
| `testing.md` | Component tests, mocked auth, axe, mock API scenarios | `*.test.*`, `*.spec.*` and `__tests__/` in `src/`, `src/mocks/`, `src/test/` |
| `e2e.md` | Playwright against the test environment only | `e2e/`, `playwright.config.*` |
| `deploy.md` | GitHub Actions, Argo CD, OpenShift | `deploy/`, `Dockerfile`, `.github/workflows/` |

### Skills and when they are used

| Skill | Use it when | Covers |
|---|---|---|
| `tdd-cycle` | Every acceptance criterion (preloaded into the Generator) | Red → green → refactor, commits, evidence |
| `test-infrastructure` | Sprint 0, and every component or page test | Mock API with typed handlers and scenarios, mock auth personas, `renderPage`, axe helper, typed fakes; mock API for the development server |
| `sg-design-system-component` | Building or changing a component in `src/components/` | Documented markup, accessibility tests first |
| `form-with-server-errors` | Any form, submit flow or confirmation page | Error summary, inline errors, focus, `401`/`403` |
| `data-page` | Lists, tables, search results, detail views | Loading, empty, error, `401`/`403`, role-based actions, table/summary list markup |
| `add-api-call` | Adding or changing a call to the backend | Generated client, typed results for every response |
| `auth-integration` | Sign-in, sign-out, tokens, session expiry, role-based visibility | PKCE, in-memory token, refresh, one place attaching the token |
| `assess-spec-sync-pr` | A backend spec-sync pull request arrives | Diff, affected screens, breaking changes, remediation sprint |
| `sprint-rubric` | Self-check and grading (preloaded into Generator and Evaluator) | Scores, pass threshold, severity guide |
| `figma-to-react` | A design, mock-up or screenshot to build | Map to Design System components, confirm, build test-first, compare |
| `review-code` | Reviewing a branch, diff or commit range, and before a pull request | The Evaluator's code-level checks and the rule files applied to a diff, findings by severity, read-only |
| `commit` | You run `/commit` | Safe staging, fast checks, message in the repo's style, hook never bypassed |
| `create-pr` | You run `/create-pr` | Review, checks, PR description file and the push commands for you to run; never pushes |
| `release-ready` | You run `/release-ready` | Build, bundle scan, accessibility, open questions; READY / NOT READY report |
| `fix-bug` | Fixing any bug, including evaluation bugs | Reproduce, failing test committed first, smallest fix, same bug elsewhere |
| `record-decision` | An open question has been answered | Procedure A: rule updated, waiting steps updated, row removed, `docs(rules)` commit |
| `changelog` | You run `/changelog` | Release notes grouped for readers; added to `CHANGELOG.md` only if you agree |
| `a11y-audit` | Every sprint evaluation (preloaded into the Evaluator), and accessibility checks before a release | axe, keyboard, focus, structure and reflow in a real browser (Playwright or Chrome) for every route and scenario; read-only |
| `content-review` | Checking wording, error messages and page titles | Plain English, sentence case, Design System patterns; suggested rewrites; read-only |

### How the agents use the layers

- **Planner** does not edit source files, so rules would not load for it automatically. It reads the relevant rule files, `docs/open-questions.md` and `openapi/openapi.json` itself, and lists rules and skills in each sprint contract as `relevantRules` and `relevantSkills`. It uses the `assess-spec-sync-pr` skill for backend spec changes.
- **Generator** reads the rules and skills named in the contract before it starts. Other rules load automatically as it edits matching files. The `tdd-cycle` skill (its working loop) and the `sprint-rubric` skill (its self-check) are preloaded.
- **Evaluator** reads the rules named in the contract plus `forms-accessibility.md`, `testing.md` and `tdd.md`, and tests every item in `docs/reference/accessibility-checklist.md`. The same `sprint-rubric` skill is preloaded, so the Generator and Evaluator grade the same way, and so is the `a11y-audit` skill, which it uses for the accessibility checks in the browser.

### Keeping the layers healthy

- **If breaking a rule would be an accessibility, security or contract problem, it stays in `CLAUDE.md`.** A path-scoped rule only loads when a matching file is touched.
- **Keep `CLAUDE.md` under 100 lines.** It is loaded into every session, so every line must apply to every task. When it grows, move detail into a rule file. Do not describe what Claude can read from the code (folder layout, `package.json` scripts) or what the settings and hooks already enforce.
- **Use plain Markdown links, not `@path` imports,** to point at reference docs. Imports load at startup and defeat the purpose.
- **One topic per rule file,** named for the area, with `paths:` that match where that code lives. If the source layout changes, update the `paths:` globs.
- **Check what is loaded** by running `/context` in a Claude Code session.

### Maintaining the layers: step by step

Use these procedures whenever the rules change. Make the change on a branch and review it like code, because it changes how every agent behaves.

**A. An open question has been answered**

1. Open `docs/open-questions.md` and find the question. The last column names where to record the answer.
2. Add the decision to that rule file in `.claude/rules/` (or the "Commands" section of `CLAUDE.md` for tooling), replacing any "TBC" line. Write it as a rule, for example "`editor` cannot assign roles; hide the roles section for editors".
3. If the answer is a value that differs by environment (Okta issuer URL, client ID, test domains), write the rule as "comes from configuration key `x`". Never put the value itself in the rule file.
4. Delete the row from `docs/open-questions.md`.
5. Only touch `CLAUDE.md` if the decision affects every task.
6. Commit: `docs(rules): record decision on <topic>`.

**B. Adding a new rule for an area**

1. Check whether an existing rule file already covers the area. If so, add to it instead.
2. Create `.claude/rules/<area>.md`. The first line must be `---`, followed by a `paths:` list of globs for where that code lives, then `---`:

   ```markdown
   ---
   paths:
     - "src/features/reports/**"
   ---
   # Reports

   - Rule one.
   - Rule two.
   ```

3. Keep it to one topic. Link to long reference material in `docs/reference/` with a normal Markdown link, not `@path`.
4. Add a row to the "Rule files and when they load" table in this section. `CLAUDE.md` does not list rule files.
5. Verify it loads (procedure E).

**C. Adding a new skill (procedure)**

1. Create the folder `.claude/skills/<skill-name>/` and a file called exactly `SKILL.md` inside it.
2. Start the file with frontmatter: `name` (the same as the folder name) and a `description` that says clearly **when** to use it, for example "Use this whenever you build or change ...".
3. Write the steps in order, and name the rule files it relies on.
4. Add it to the skills table in this section. It does not need listing in `CLAUDE.md`: Claude sees every skill's description automatically.
5. If an agent should always have it, add it to that agent's `skills:` list; otherwise the Planner names it in sprint contracts under `relevantSkills`.

**D. `CLAUDE.md` is getting long**

1. Find the section that only matters for part of the codebase.
2. Move it into the matching rule file (or create one, procedure B).
3. Do not leave an index entry behind: rules load by their `paths:`, not from `CLAUDE.md`.
4. Keep anything whose breach would be an accessibility, security or contract problem in `CLAUDE.md`.

**E. Checking that a rule actually loads**

1. Start a normal session: `claude`.
2. Ask Claude to open a file in the area, for example "Open a component in `src/components/` and summarise it".
3. Run `/context`. The matching rules (here `design-system.md` and `forms-accessibility.md`) should be listed; unrelated rules (for example `e2e.md`) should not.
4. If a rule is missing, check the `paths:` globs match the real folder names and that `---` is on the very first line of the file. Run `claude --debug` if it still does not appear.

**F. The folder layout changes**

1. Search `.claude/rules/` for the old folder name.
2. Update every `paths:` glob that uses it, and the table in this section.
3. Verify with procedure E.


---

## 3. Test-driven development (TDD)

Both the backend and the frontend are built **test-first**. Every behaviour starts as a test that fails, then the minimum code is written to make it pass, then the code is tidied. This is the rule in `CLAUDE.md` and `.claude/rules/tdd.md`, and the `tdd-cycle` skill is the Generator's working loop.

### The cycle, for each acceptance criterion

```
   ┌───────────────┐      ┌──────────────────┐      ┌──────────────────┐
   │  1. RED       │ ───► │  2. GREEN        │ ───► │  3. REFACTOR     │
   │ write tests,  │      │ minimum code to  │      │ tidy code/tests, │
   │ see them fail │      │ make them pass   │      │ still all green  │
   └───────────────┘      └──────────────────┘      └──────────────────┘
          ▲                                                   │
          └──────────────── next acceptance criterion ◄───────┘
```

### Who does what

| Agent | TDD responsibility |
|---|---|
| **Planner** | Writes concrete `testScenarios` (given / when / then, with a test level) for every acceptance criterion in the sprint contract, including failure, denial and accessibility paths. |
| **Generator** | Runs the red → green → refactor loop for each AC in order, commits the failing tests before the code, and records the red and green runs as evidence. Fixes on a retry start with a failing test that reproduces the bug. |
| **Evaluator** | Checks the evidence and the git history, re-runs the tests at the test commit to prove they really failed, and deliberately breaks the code in a temporary copy to prove the tests catch it. Missing TDD evidence is a `high` bug and fails the sprint. |

### Example test scenario in a contract

```json
{ "acId": "AC3", "scenarios": [
  { "given": "the create user form with an empty email", "when": "the operator submits it", "then": "the error summary appears, receives focus, and links to the email field", "level": "component" } ] }
```

### What the git history looks like

For each acceptance criterion you will see commits in this order:

```
test(sprint-05): AC2 failing tests
feat(sprint-05): create user - implement AC2
refactor(sprint-05): extract role mapping          (optional)
```

and on a retry:

```
test(sprint-05): reproduce missing 403 audit record
fix(sprint-05): create user - resolve missing 403 audit record
```

The `test(...)` commits deliberately contain failing tests. That is expected on a feature branch. If your team requires every commit on `main` to pass, use **squash merge** for these pull requests; the TDD history has already been checked by the Evaluator before you merge.

### The evidence recorded for each AC

In `sprints/sprint-NN/implementation-status.json`:

```json
"tdd": {
  "AC2": {
    "tests": ["..."],
    "red":   { "command": "npm test -- src/pages/CreateUserPage.test.tsx", "result": "2 failed: ...", "commit": "a1b2c3d" },
    "green": { "command": "npm test -- src/pages/CreateUserPage.test.tsx", "result": "2 passed", "commit": "d4e5f6a" },
    "refactored": true
  }
}
```

A rare genuine exemption (for example, adding a dependency) is recorded as `"tddExempt": "<reason>"`.

### Test levels

| Level | Tool | Use it for | Fast loop? |
|---|---|---|---|
| Component / page | Testing Library + axe, with a mocked auth interface and mocked services | Rendering, forms, validation, error summary focus, role visibility, `401`/`403` handling, screen states | Yes |
| Service | Test runner with the generated client mocked | Mapping each API response to a typed result | Yes |
| Browser (Evaluator) | Playwright MCP against the local app | Visual Design System fidelity, keyboard use, reflow | No: checked by the Evaluator |
| E2E | Playwright against the deployed test environment | Full journeys for `admin`, `editor` and `viewer` | No: written with the feature, run in CI |

### How the Evaluator checks TDD

1. Every AC has red and green evidence, or a justified exemption.
2. In `git log`, the `test(...)` commit for each AC comes before its `feat(...)` commit, and test names include the AC id.
3. **Red is real:** it checks out the test commit in a temporary git worktree under `/tmp`, runs those tests, and confirms they fail for the right reason.
4. **Tests protect the behaviour:** in another temporary worktree it deliberately breaks the code (for example: stop moving focus to the error summary, show an editor-only action to everyone, drop a label association) and confirms a test fails.
5. No tests were deleted, skipped (`.skip` / `xit`) or weakened.

Your working copy is never changed by these checks. Section 8 explains worktrees in more detail.

### What you should look at

When reviewing a sprint, open the `tdd` section of `implementation-status.json` and `checks.tdd` in the evaluation file, and skim `git log --oneline` for the test → feat pattern. Read a few of the tests: they should describe behaviour a user or operator cares about, not implementation details.

---

## 4. Prerequisites

Make sure you have the following before you start:

1. **Claude Code** installed and signed in. See https://code.claude.com/docs/en/overview.
2. **The frontend repository** cloned locally, with `CLAUDE.md` at the repository root and `openapi/openapi.json` present.
3. **Node.js (current LTS)** and npm. Check with `node -v` and `npm -v`, then run `npm install`.
4. **Playwright browsers**: run `npx playwright install`. The Evaluator also uses the Playwright MCP server, which it starts itself with `npx`.
5. **Git** configured with your name and email. The Generator commits its work on your local branch.
6. **Optional:** the backend running locally, only if you want to pull a newer spec with `npm run api:update` during development.
7. **jq** (or `python3`), used by the Claude Code hook that protects files (Step 5.4). For example: `brew install jq`.
8. **Optional:** yamllint and Hadolint, used by the pre-commit lint hook for YAML and Dockerfiles. Without them those checks are skipped locally and still run in CI.
9. **Optional:** the Snyk CLI, only if you want to turn on the Snyk security checks (section 9).

> **Important:** The agents never use real environments, real Okta orgs or real people's accounts. Local work uses a **mock API and mocked sign-in**. E2E tests only run against a deployed **test** environment with dedicated **test** users, and only when you have set those details yourself as environment variables.

> **Build tooling is not finalised yet.** The commands in `CLAUDE.md` are placeholders. The first sprint will probably ask you to choose tooling (for example the build tool and test runner). Answer those questions, then update the "Commands" section of `CLAUDE.md` and remove question 3 from `docs/open-questions.md`.

---

## 5. One-time set-up

### Step 5.1: Create a working branch

Agents commit to whatever branch you are on. Work on a feature branch, never on `main`:

```bash
git checkout main
git pull
git checkout -b feature/<short-name>
```

### Step 5.2: Add the agent files

Copy the three agent files into the repository so the folder looks like this:

```
/
├── CLAUDE.md                      ← core rules, always loaded
├── .githooks/
│   ├── pre-commit                 ← lint hook (see Step 5.2), plus optional Snyk checks
│   ├── pre-push                   ← optional Snyk code check
│   └── snyk.conf, snyk-lib.sh     ← Snyk switches, off by default (section 9)
├── .claude/
│   ├── settings.json              ← permission rules and hook registration
│   ├── hooks/
│   │   └── protect-files.sh       ← protects secrets and critical files
│   ├── agents/
│   │   ├── planner.md
│   │   ├── generator.md
│   │   └── evaluator.md
│   ├── rules/                     ← area rules, loaded by path
│   │   ├── api-client.md
│   │   ├── auth.md
│   │   ├── code-style.md
│   │   ├── deploy.md
│   │   ├── design-system.md
│   │   ├── e2e.md
│   │   ├── forms-accessibility.md
│   │   ├── tdd.md
│   │   └── testing.md
│   └── skills/                    ← procedures, loaded when needed
│       ├── tdd-cycle/SKILL.md
│       ├── test-infrastructure/   (SKILL.md + templates/)
│       ├── add-api-call/SKILL.md
│       ├── assess-spec-sync-pr/SKILL.md
│       ├── auth-integration/SKILL.md
│       ├── data-page/SKILL.md
│       ├── form-with-server-errors/SKILL.md
│       ├── sg-design-system-component/SKILL.md
│       ├── sprint-rubric/SKILL.md
│       ├── figma-to-react/SKILL.md
│       ├── fix-bug/SKILL.md
│       ├── a11y-audit/SKILL.md
│       ├── content-review/SKILL.md
│       ├── review-code/SKILL.md
│       ├── commit/SKILL.md
│       ├── create-pr/SKILL.md
│       ├── release-ready/SKILL.md
│       ├── changelog/SKILL.md
│       └── record-decision/SKILL.md
├── docs/
│   ├── AGENT-WORKFLOW-GUIDE.md    ← this file
│   ├── open-questions.md
│   └── reference/
│       └── accessibility-checklist.md
├── openapi/
│   └── openapi.json
└── ...
```

Turn on the pre-commit **lint hook** first, so this commit is checked too:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit        # only needed if Git reports the hook is not executable
```

Then commit the files so the whole team uses the same agents and rules:

```bash
git add CLAUDE.md .claude docs .githooks
git commit -m "chore: add multi-agent build workflow"
```

**About the lint hook.** Every commit, by a person or an agent, runs `.githooks/pre-commit`. It lints only the files being committed: ESLint (with the repo's typescript-eslint and accessibility rules, no warnings allowed) on staged `.ts`/`.tsx`/`.js` files, yamllint on YAML files and Hadolint on Dockerfiles. Generated API code is skipped. ESLint is skipped with a note until `npm install` has run.

- If it fails, fix what it reports, `git add` again and commit again.
- Run it by hand with `bash .githooks/pre-commit`, or `bash .githooks/pre-commit --all` for every file.
- Tests do not run here, because the agents deliberately commit failing tests (section 3).
- Never bypass it with `--no-verify` or `-n`.
- Optional **Snyk** security checks run in the same hooks, but they are off by default (section 9).
- Other checks before commit or push, and whether to use a hook manager, are still open (see `docs/open-questions.md`).

Also make sure `.gitignore` excludes Playwright's saved sign-in session files (for example `e2e/.auth/`) and any `.env` files.

### Step 5.3: Trust the folder

The Evaluator starts its own Playwright browser server. Claude Code only starts that server after you have **accepted the workspace trust prompt** for this repository folder. Accept it the first time you run Claude Code here.

### Step 5.4: Review what Claude can and cannot touch

The zip includes `.claude/settings.json` and a PreToolUse hook, `.claude/hooks/protect-files.sh`. Together they decide which files Claude can read and edit, and which commands it can run, for you and for every agent.

**Four tiers of files**

| Tier | What | Examples in this repository |
|---|---|---|
| 1. Never read | Secrets | `.env`, `.env.*` (but `.env.example` is fine), keys and keystores (`*.pem`, `*.key`, `*.p12`, `*.jks`); `~/.ssh`, `~/.aws`, `~/.kube`, `~/.docker/config.json`, `~/.m2/settings.xml`, `~/.npmrc`, the Snyk token (`~/.config/configstore/snyk.json`); Playwright sign-in session files (`e2e/.auth/**`, `*storageState*.json`) |
| 2. Never edit | Files a person must change | `.claude/settings.json`, `.claude/hooks/**`, `.githooks/**`, `.git/**`, `.github/workflows/**`, `deploy/**`; `openapi/**` and `src/services/api/generated/**` (spec-sync PRs only); direct edits to `package-lock.json` (it changes through `npm install`) |
| 3. Ask first | Configuration and project guidance: Claude may change them, but you approve each change | `CLAUDE.md`, `.claude/rules/**`, `.claude/agents/**`, `.claude/skills/**`, `docs/**`, `Dockerfile`, `.gitignore`, `package.json`, ESLint, TypeScript, build-tool and Playwright config. Reading log files also asks, because they can contain personal data. |
| 4. Free to edit (auto-approved) | Everyday work: Claude edits these without asking | `src/**` (except generated code), `e2e/**`, `specs/**`, `sprints/**` |

**Auto-approved (no prompt)**

| Kind | Allowed without asking |
|---|---|
| File edits | `src/**`, `e2e/**`, `specs/**`, `sprints/**` (tier 4). Tier 2 and 3 files inside these folders stay protected, because deny and ask rules always win over allow (for example `src/services/api/generated/**` is still refused). |
| Build and test | `npm install`, `npm ci`, `npm run *`, `npm test*`, `npx playwright *`, `npx eslint *`, `npx tsc *`, `node_modules/.bin/eslint *` |
| Git (read and local only) | `git status`, `git diff`, `git log`, `git show`, `git branch` (except `-D`), `git checkout -b`, `git switch` (except `-f` and `--discard-changes`), `git rev-parse`, `git merge-base`, `git add`, `git commit`, `git worktree` |
| Lint | `bash .githooks/pre-commit`, `yamllint`, `hadolint` |

The hook still checks every auto-approved command, so `git commit --no-verify` or a shell write to a protected file is refused even though `git commit` and file edits are allowed. Anything not listed here asks first, the first time in a session.

**Commands that are blocked**

| Category | Examples |
|---|---|
| Reading secrets through the shell | `cat .env`, `grep ... .env.local`, `printenv`, `env` |
| Writing protected files through the shell | `sed -i`, `>`, `tee`, `cp`, `mv` or `rm` on tier 2 files |
| Bypassing checks | `--no-verify`, `git commit -n`, changing `core.hooksPath` |
| Publishing | `git push`, `npm publish`, `mvn deploy` |
| Real environments | `oc`, `kubectl`, `helm`, `argocd`, `aws`, `az`, `gcloud`, `docker login` |
| Snyk switches and account | `SNYK=...`, `git config hooks.snyk...`, `snyk auth`, `snyk monitor`, `snyk config`, `snyk ignore` (people only; running the Snyk checks is allowed) |
| Network | `curl`/`wget` to anything other than `localhost` or `127.0.0.1` |
| Discarding work | `git reset --hard`, `git clean -f`, `git checkout -- .`, `git branch -D`, `git switch -f`; a recursive `rm` outside `/tmp` asks first |

**Why two layers?** The permission rules in `settings.json` (`allow`, `ask`, `deny`) cover Claude's file tools. A shell command such as `cat .env` or `sed -i deploy/...` goes around them, so the hook checks every tool call, including shell commands, and denies or asks as needed. Deny always wins over ask, and ask over allow.

**What happens when something is blocked:** Claude is told why and is instructed not to work around it. It stops and tells you what change a person needs to make, and you make that change yourself.

**Prerequisite:** the hook needs `jq` (or `python3`). Without either, it blocks tool calls and says so.

**Check it works** after unzipping. Start `claude` and ask it to:
1. read `.env` (it should be refused);
2. edit a file in `deploy/` (refused);
3. edit `CLAUDE.md` (it should ask you);
4. run `git push` (refused).

Run `/permissions` inside Claude Code to see the active rules.

**Changing the rules:** edit `.claude/settings.json` or `.claude/hooks/protect-files.sh` yourself, in a reviewed pull request. Claude cannot edit them. For personal additions, use `.claude/settings.local.json` (not committed). Rules from both files are combined, and deny always wins.

### Step 5.5: Check the agents are recognised

Start Claude Code with the Planner as the main session:

```bash
claude --agent planner
```

The startup header should show `@planner`. If it does not, see "Troubleshooting" at the end of this guide.

---

## 6. Running a build cycle

### Step 6.1: Start the Planner

From the repository root:

```bash
claude --agent planner
```

Always start this way. Running the Planner as the main session is what allows it to ask you questions directly.

### Step 6.2: Describe what you want (1-4 sentences)

Type a short request. Focus on what the operator needs to do, not on the implementation. For example:

> Build a "Create user" page where an operator enters a new user's name and email and chooses their roles. Show server validation errors properly, and after a successful submit show a confirmation page that includes the user type returned by the server.

### Step 6.3: Review the spec, open questions and backend dependencies

The Planner reads `openapi/openapi.json`, writes `specs/product-spec.json`, and replies with:

- a short summary of the features, the Design System components each uses, and how they are split into sprints (up to 8);
- **open questions** that block the work, from `docs/open-questions.md`: the `admin`/`editor` permission matrix, Okta details and OIDC library, build tooling, how the app is served, E2E test domains;
- **backend dependencies**: anything the UI needs that is **not** in the API spec yet (a missing endpoint, field or error code).

What to do:

1. Read the summary. Open `specs/product-spec.json` for the detail.
2. Answer every open question you can. If you do not know, say so. The Planner will either scope that part as configurable (no guessed values) or hold that sprint back.
3. For each backend dependency, raise it with the backend team (or run the backend Planner in the backend repository). The UI agents will never invent an API.
4. Ask for changes if the scope or sprint order looks wrong.

### Step 6.4: Approve with "good to go"

When you are happy with the spec, reply:

> good to go

Nothing is built until you say this. The Planner then creates or updates `sprints/status.json` (continuing the sprint numbering from any previous cycle) and writes the first sprint contract to `sprints/sprint-NN/contract.json`.

### Step 6.5: Let the sprint loop run

From here the Planner runs the loop on its own:

1. **Generator** works through the acceptance criteria one at a time, test-first: it writes the failing component and service tests from the contract's `testScenarios` and commits them, writes the minimum code to pass with the Design System and commits it, then refactors. It also updates the E2E tests, runs type check, lint, tests and build, and writes `self-eval.json`.
2. **Evaluator** creates `evaluation-RR.json` straight away, reruns every check, starts the app locally with the mock API and mocked sign-in, and drives it in a real browser. It tests every acceptance criterion, keyboard-only use, focus, error summaries, reflow at 320 px and 200% zoom, automated accessibility checks, role visibility, `401`/`403` handling and token storage. It also checks the TDD evidence (section 3). It finishes with scores and a `PASS` or `FAIL` verdict.
3. **Planner** checks the evaluation file is complete and valid, then:
   - on **PASS**, marks the sprint done and moves to the next one;
   - on **FAIL**, sends the Generator back with the evaluation file to fix every listed bug (up to 5 attempts in total).

You may be asked to approve commands unless the command is pre-approved in `.claude/settings.json` (Step 5.4).

### Step 6.6: Answer decisions when asked

The Generator stops rather than guessing in two situations:

- **NEEDS-DECISION**: something is TBC, a tooling choice is needed, or a major dependency or architectural change is involved. The Planner shows you the options and their impact. Reply with your decision; it is recorded in the sprint contract and the sprint restarts.
- **CONTRACT-MISMATCH**: the sprint needs something that is not in `openapi/openapi.json`. The Planner pauses that sprint and adds a backend dependency. Raise it with the backend team; once their spec-sync PR is merged here, ask the Planner to resume.

### Step 6.7: Review the result of each sprint

When a sprint passes, the Planner gives you a short summary. Before moving on, it is good practice to check:

| Where to look | What to check |
|---|---|
| `git log --oneline` | The `test(...)` → `feat(...)` pattern for each acceptance criterion. |
| `git diff` | The commits for the sprint. |
| `sprints/sprint-NN/evaluation-RR.json` | Scores, accessibility results, bugs found and fixed, whether E2E ran. |
| `sprints/sprint-NN/implementation-status.json` | The `tdd` red/green evidence per acceptance criterion, assumptions made, anything `unverified`. |
| The running app | Try the new screens yourself, including with the keyboard only. |

The agents make mistakes. The Evaluator reduces them but does not replace human review, and automated accessibility checks do not replace testing with assistive technology.

### Step 6.8: Finish the cycle

When no sprints remain, the Planner sets `buildStatus` to `complete` in `sprints/status.json` and gives you a final summary: sprints done and blocked, backend dependencies raised, and anything that could not be verified (for example E2E tests that could not run locally).

Then:

1. **Record the decisions.** The Planner tells you which open questions were answered and where each belongs. Add each decision to that rule file in `.claude/rules/` (or confirm the commands in `CLAUDE.md`), then delete the question from `docs/open-questions.md` (section 2, procedure A). The agents do not edit these files unless you ask.
2. **Review the whole branch** as you would any pull request.
3. **Push and open a pull request** yourself. CI then runs type check, lint, component tests, the generated-types check, the build and the Playwright tests against the test environment.

---

## 7. Building the UI: first steps and adding pages

This section is the practical walkthrough: how to go from an empty repository to the first working pages, and the repeatable routine for adding more.

### The order between the two repositories

The UI can only use API operations that exist in the backend's `openapi.json`, and the agents never guess an API. So work in this order:

| Can start straight away | Needs the backend first |
|---|---|
| Build tooling, test infrastructure, the app shell (Design System header, footer, home page), sign-in with Okta | Any page that shows or sends data (user lists, forms, detail pages) |

The simplest plan is to run both repositories in parallel. The backend builds its Sprint 0 and first endpoints while the UI builds its foundation.

### First steps (once)

1. **Set up** as in sections 4 and 5: install the prerequisites, add the files on a branch, and accept the workspace trust prompt.
2. **Settle the blocking open questions** in `docs/open-questions.md`, or be ready to answer them when the Planner asks:

   | # | Question | Why it blocks |
   |---|---|---|
   | 3 | Build tooling (build tool, test runner, npm scripts) | Nothing can be built without it |
   | 7 | Mock API library (proposed: MSW) | Needed by the test infrastructure |
   | 8 | Formatter (Prettier or not) | Decides the formatting hook |
   | 2 | OIDC library and Okta details | Needed for sign-in |
   | 1 | What `admin` and `editor` may each do | Decides what each role sees |

3. **Start the Planner** with `claude --agent planner` and ask for the foundation, for example:

   > Set up the UI foundation: the chosen build tooling, the Scottish Government Design System package, an app shell with the Design System header, footer and a home page, sign-in with Okta for admin, editor and read-only viewer operators, and the shared test infrastructure.

4. The Planner makes **Sprint 0: test infrastructure** the first sprint, followed by sprints such as "app shell" and "sign-in". Review the summary, answer its questions, and reply `good to go`.
5. **Review each passed sprint** (Step 6.7). Then run the app with the mock API and try it as the `admin`, `editor` and `viewer` personas. The command is recorded in `CLAUDE.md` after Sprint 0.
6. **Finish the cycle** (Step 6.8): record the answered questions in their rule files, then push the branch and open a pull request yourself.

### Getting the first API contract into the UI

Before the first data page, `openapi/openapi.json` must come from the backend. The long-term route is the backend's **spec-sync workflow**, which opens a pull request here automatically whenever the contract changes. That workflow is a CI change, so it has to be explicitly requested in the backend repository.

Until it exists, a person brings the spec over on a `spec-sync/` branch. The commit hook only allows spec changes on those branches:

```bash
git checkout -b spec-sync/initial
# copy the backend's generated openapi.json into openapi/openapi.json
npm run api:generate
git add openapi src/services/api/generated
git commit -m "chore(spec-sync): initial API contract"
```

Open a pull request for it, and merge it before starting data pages.

### Adding a page (repeat for each page)

1. **Create a branch**, for example `git checkout -b feature/users-page`.
2. **Start the Planner** (`claude --agent planner`) and describe what the operator needs to do, which roles can do it, and what they see. For example:

   **A list page** (the Planner uses the `data-page` skill):
   > Add a "Users" page that lists provisioned users in a table showing name, email, user type and roles. Admins see a "Create user" button; editors don't. Show a clear message when there are no users.

   **A form page** (the `form-with-server-errors` skill):
   > Add a "Create user" page where an admin enters a new user's name and email and chooses their roles. Show server validation errors properly, and after success show a confirmation page with the user type returned by the server.

   **A detail page** (the `data-page` skill):
   > Add a user detail page, reached from the Users table, showing the user's details and roles in a summary list.

3. **The Planner then:**
   - checks every operation the page needs exists in `openapi/openapi.json`, and lists anything missing as a backend dependency instead of inventing it;
   - writes the spec and a sprint contract, with test scenarios, accessibility requirements, Design System components and role visibility;
   - picks the skills (`data-page`, `form-with-server-errors`, `add-api-call`, `sg-design-system-component`);
   - continues the sprint numbers from where the last cycle stopped.
4. **Reply `good to go`.** The Generator and Evaluator build the page test-first, including the mock handlers and scenarios for its API calls.
5. **Try the page yourself** with the mock API: as each persona, and with the error scenarios (`empty`, `forbidden`, `serverError`). Then do a quick keyboard-only run-through.
6. **Push the branch and open a pull request.**

### When a page needs something the API does not have

1. The Planner (or the Generator, with `CONTRACT-MISMATCH`) pauses that page and says exactly what is missing.
2. Ask for it in the backend repository, for example with its Planner: "Add an endpoint to list provisioned users, for admins and editors."
3. When the updated spec arrives in a spec-sync pull request, ask the UI Planner to "Assess this spec-sync PR" (section 10), merge it, and ask the Planner to resume the page.

### Tips

- **One page per sprint.** You can ask for several pages at once; the Planner still gives each its own sprint.
- **Describe journeys, not components.** Say "an admin creates a user and sees confirmation", not "use a text input". The Planner maps journeys to Design System patterns.
- **Always say who can do what** (`admin`, `editor`, `viewer`; a `viewer` can only read) until the permission matrix is agreed.
- **Check the accessibility yourself as well.** Automated checks catch a lot, but not everything. A keyboard-only run-through of each new page takes a minute.

---

## 8. Using Git worktrees

A Git worktree is a second working folder for the same repository, with its own branch checked out. Worktrees let two things happen at once without disturbing each other. They share the same Git history, so there is nothing to clone or sync.

```bash
git worktree list                                             # show all worktrees
git worktree add ../frontend-users -b feature/users            # new folder + new branch
git worktree remove ../frontend-users                          # delete the folder when done
git worktree prune                                            # tidy up after folders deleted by hand
```

### How the agents use worktrees today

Only the **Evaluator** uses worktrees, for its TDD checks (section 3):

- **Red is real:** it checks out each acceptance criterion's `test(...)` commit in `/tmp/tdd-red` and runs those tests to prove they failed.
- **Tests protect the behaviour:** in another worktree at `HEAD`, it deliberately breaks a piece of the code and confirms a test fails.

It removes both worktrees afterwards. Your working folder and branch are never touched. In the frontend it may run `npm ci` inside the worktree first.

The **Generator** builds in your normal working folder, and sprints run one at a time.

### When you might use worktrees yourself

**1. Your own work while the agents run (recommended).** Leave the agents working in the main folder and do your own reviews, experiments or small fixes in a separate worktree on a different branch. Nothing you do there can disturb a sprint in progress.

**2. Two independent features in parallel (use with care).** Run a separate Planner session in each worktree, each on its own feature branch:

```bash
git worktree add ../frontend-users  -b feature/users
git worktree add ../frontend-audit  -b feature/audit-view
cd ../frontend-users && claude --agent planner
```

Only do this when the features are truly independent, and follow these rules:

- **Sprint numbers:** each Planner picks the next number after the highest one it can see, so two parallel Planners would pick the same numbers. Give each one its own range in your request, for example "Use sprint numbers 20–29" and "Use sprint numbers 30–39".
- **One planning cycle per branch.** Never run two Planners on the same branch; Git does not allow the same branch to be checked out in two worktrees anyway.
- **Expect merge conflicts in shared files:** `specs/product-spec.json`, `sprints/status.json`, the mock handlers in `src/mocks/` and shared components. Merge one branch into `main` first, then update the second branch from `main` and resolve conflicts, keeping both sets of entries in `status.json` and the spec.
- **Ports:** Two dev servers cannot use the same port. Start the second one on another port (see the build tool's `--port` option).
- **Dependencies:** run `npm ci` in each new worktree, because `node_modules` is not shared.

### Things to know

- **Same protections everywhere.** When you start Claude Code inside a worktree, that worktree is the project folder. `.claude/settings.json`, the file-protection hook and the rules all apply there as normal.
- **The lint hook applies too.** `core.hooksPath` is stored in the repository's Git configuration, which all worktrees share, so the pre-commit lint hook runs in every worktree.
- **Local files are not copied.** Git-ignored files such as `.env`, `.env.local`, `node_modules/` and `CLAUDE.local.md` exist only in the folder where you created them.
- **Clean up** finished worktrees with `git worktree remove <folder>`. If a folder was deleted by hand, run `git worktree prune`.

---

## 9. Snyk security checks (off by default)

Snyk checks for known vulnerabilities and security problems. The checks are built into the Git hooks, but they are **switched off by default**. Anyone can turn them on for their own clone, and the team can turn them on for everyone later.

### What Snyk checks, when turned on

| Check | Command | When it runs | Default once Snyk is on |
|---|---|---|---|
| Dependencies | `snyk test` | On commit, when `package.json` or `package-lock.json` is staged | On |
| Infrastructure | `snyk iac test` | On commit, when `deploy/` manifests are staged | On |
| Your own code | `snyk code test` | On push (`.githooks/pre-push`) | **Off.** It uploads your source code to Snyk, so it needs approval first (open question #10). |

Only issues at **high** or **critical** severity block a commit or push. If Snyk can't run (not installed, not signed in, or no network), it **warns and lets the commit through**; CI remains the real gate.

### Turning Snyk on for yourself

1. Install the Snyk CLI and sign in once. See Snyk's CLI installation page; for example, with Homebrew: `brew tap snyk/tap && brew install snyk-cli`. Then run `snyk auth`.
2. Turn the checks on for your clone only (nothing is committed):
   ```bash
   git config hooks.snyk true
   ```
3. Optional personal settings:
   ```bash
   git config hooks.snyk.code true                  # also run the code check on push (once approved)
   git config hooks.snyk.iac false                  # skip the infrastructure check
   git config hooks.snyk.severity medium            # block on medium and above
   git config hooks.snyk.whenUnavailable block      # block instead of warn if Snyk can't run
   ```
4. To go back to the team default: `git config --unset hooks.snyk` (and `--unset` any other `hooks.snyk.*` you set).

For a single command only: `SNYK=1 git commit ...` turns Snyk on once, and `SNYK=0 git commit ...` skips it once.

### Turning Snyk on for the whole team

Edit `.githooks/snyk.conf` in a reviewed pull request, for example `SNYK_ENABLED=true`. The same file holds the team defaults for each check, the severity level and what happens when Snyk is unavailable. Personal settings always win over the team default for that person.

### Which setting wins

1. `SNYK=1` or `SNYK=0` on a single command;
2. your personal `git config hooks.snyk...` settings;
3. the team default in `.githooks/snyk.conf`.

When Snyk is off and a dependency or `deploy/` file is committed, the hook prints one line saying so, so it's never silently skipped.

### When Snyk finds an issue

- **Dependency issue:** upgrade to a fixed version if one exists. Snyk's output says which version fixes it. Changes to `package.json` or `package-lock.json` need approval when made by Claude.
- **No fix available yet:** agree a justified ignore in a `.snyk` policy file, with a reason and an expiry date, reviewed like any other change. Only people add ignores.
- **Infrastructure or code issue:** fix it like any other bug. For agent work, the Evaluator records it as a `high` bug.

### Agents and Snyk

- Agents can run the Snyk checks, but **cannot turn Snyk on or off**. `SNYK=...` and `git config hooks.snyk...` are blocked for them.
- They cannot sign in (`snyk auth`), upload a project snapshot (`snyk monitor`), change Snyk configuration or add ignores. They also cannot read the Snyk token, which is protected like other secrets.
- If Snyk blocks an agent's commit, the agent reports the issue instead of working around it.
- The Evaluator runs the Snyk checks only when Snyk is turned on, and records `"off"` otherwise.

---

## 10. When the backend's API changes

The backend's CI opens a **spec-sync pull request** in this repository whenever the API contract changes. It updates `openapi/openapi.json` and `src/services/api/generated/`.

1. Check out the spec-sync PR branch.
2. Start the Planner (`claude --agent planner`) and ask (it follows the `assess-spec-sync-pr` skill):

   > Assess this spec-sync PR against the UI.

3. The Planner lists what was added, changed and removed, which screens are affected, and which changes break the UI.
4. If something breaks, accept the remediation sprint it offers. It goes through the normal Generator/Evaluator loop.
5. Merge the spec-sync PR as normal once the UI matches.

Never hand-edit `openapi/openapi.json` or the generated files. If you used `npm run api:update` against a local backend, revert those changes before committing.

---

## 11. When things go wrong

### A sprint is marked "blocked"

After 5 failed attempts the Planner marks the sprint `blocked` and writes `sprints/sprint-NN/blocked.json` with the unresolved bugs. It only continues with later sprints that do not depend on the blocked one.

What to do:

1. Read `blocked.json` and the latest `evaluation-RR.json`.
2. Decide whether the contract was unrealistic, a decision is missing, the API lacks something, or the code needs a human.
3. Either fix it yourself, or change the contract and ask the Planner to retry the sprint, for example: "Retry sprint 5 with the updated contract."

### The evaluation file is missing or stuck on "IN_PROGRESS"

The Planner retries the Evaluator up to 2 times. If it is still incomplete, the sprint is marked `in-review` and the Planner stops and reports the problem. Usually the cause is that the app, the mock API or the browser could not start.

### The browser tests cannot run

Common causes:

- Playwright browsers are not installed: run `npx playwright install`.
- The workspace trust prompt was not accepted, so the Playwright server did not start (see Step 5.3).
- No mock API or mock sign-in exists yet. Sprint 0 creates them with the `test-infrastructure` skill; the Evaluator logs a bug if they are missing.
- The dev server port is already in use.

### E2E tests show as "not run"

That is expected when working locally. The Playwright E2E suite only runs against a deployed test environment with dedicated test users, and only if those details are provided as environment variables. CI runs it on your pull request.

### You want to stop

Press `Esc` to interrupt Claude Code at any point. Everything done so far is in files and commits, so you can restart later with `claude --agent planner` and ask it to continue from `sprints/status.json`.

---

## 12. Rules everyone should know

These come from `CLAUDE.md` and the agent files. They apply to people as much as to agents:

1. **Test first.** No production code without a failing test that needs it.
2. **Never guess the API.** If it is not in `openapi/openapi.json`, ask the backend team.
3. **Never hand-edit generated files** (`openapi/openapi.json`, `src/services/api/generated/`).
4. **The UI never decides internal or external.** The backend decides it from the email domain, and it applies only to User Role Management. User Provisioning is for internal users only; the operator chooses the user type (Government, Forestry or Nature).
5. **The UI is not a security boundary.** Hiding a button is for usability; the backend enforces permissions.
6. **Tokens stay in memory** and are never logged. No personal data or full API payloads in the console.
7. **Accessibility is mandatory:** WCAG 2.2 AA, Design System markup, plain English.
8. **Never weaken accessibility, validation or security to pass a test, and never delete, skip or weaken a test to pass a build.**
9. **No real environments, Okta orgs or people's accounts** in any test.
10. **No secrets, hostnames or environment URLs** in code or committed files. Build-time variables end up in the public bundle.
11. **No changes to `.github/workflows/` or `deploy/`** unless explicitly asked for in the sprint contract.
12. **Only the Evaluator writes evaluation files.** A verdict mentioned in chat does not count.
13. **Humans push and merge.** Agents commit locally only.
14. **Never bypass the lint hook.** No `--no-verify` or `-n`, and no loosening the lint rules to get a commit through.
15. **Protected files stay protected.** If Claude is blocked, a person makes the change; nobody works around the rules.
16. **Snyk is off unless a person turns it on.** Agents never change the Snyk switches or add ignores; nobody switches Snyk off to get round an issue.

---

## 13. File reference

| File | Written by | Purpose |
|---|---|---|
| `CLAUDE.md` | People | Core rules and source of truth; always loaded. |
| `.githooks/pre-commit` | People | Pre-commit lint hook, plus optional Snyk dependency and infrastructure checks (turned on with `git config core.hooksPath .githooks`). |
| `.githooks/pre-push` | People | Optional Snyk code check on push. |
| `.githooks/snyk.conf`, `.githooks/snyk-lib.sh` | People | Snyk team defaults (off) and shared helper. Personal settings use `git config hooks.snyk...` (section 9). |
| `.claude/settings.json` | People | Permission rules: allowed, ask-first and denied files and commands (Step 5.4). |
| `.claude/hooks/protect-files.sh` | People | PreToolUse hook that protects secrets, critical files and real environments, including through shell commands (Step 5.4). |
| `.claude/rules/*.md` | People | Detailed area rules; loaded when matching files are touched. |
| `.claude/skills/*/SKILL.md` | People | Step-by-step procedures; loaded when needed. |
| `docs/open-questions.md` | People | Decisions still to be made. |
| `docs/reference/accessibility-checklist.md` | People | WCAG 2.2 AA checklist used for self-check and evaluation. |
| `.claude/agents/planner.md` | People | Planner definition. |
| `.claude/agents/generator.md` | People | Generator definition. |
| `.claude/agents/evaluator.md` | People | Evaluator definition, including its Playwright browser server. |
| `openapi/openapi.json` | Backend spec-sync PR | The API contract. Never edit by hand. |
| `src/services/api/generated/` | Backend spec-sync PR / `npm run api:generate` | Generated API types. Never edit by hand. |
| `specs/product-spec.json` | Planner | Full UI spec, open questions and backend dependencies. |
| `sprints/status.json` | Planner | Overall tracker: sprint list, status, retries. |
| `sprints/sprint-NN/contract.json` | Planner | What the sprint must deliver and how it is judged. |
| `sprints/sprint-NN/implementation-status.json` | Generator | Live per-criterion progress, TDD red/green evidence, assumptions. |
| `sprints/sprint-NN/self-eval.json` | Generator | Generator's own check before QA. |
| `sprints/sprint-NN/evaluation-RR.json` | Evaluator | Scores, accessibility results, bugs and verdict for attempt RR. |
| `sprints/sprint-NN/blocked.json` | Planner | Summary of a sprint that failed 5 times. |

### Sprint statuses in `sprints/status.json`

| Status | Meaning |
|---|---|
| `pending` | Not started. |
| `in-progress` | Generator or Evaluator is working on it. |
| `in-review` | The evaluation could not be completed; needs a human. |
| `done` | Passed evaluation. |
| `blocked` | Failed 5 times; needs a human. |

### Pass rules used by the Evaluator

A sprint passes only if **all** of these are true:

- every acceptance criterion passes;
- TDD evidence exists for every acceptance criterion, with the test commit before the implementation commit;
- Functionality and Craft & TDD each score **6 or more** out of 10;
- Accessibility & Design System scores **8 or more** out of 10;
- Security scores **8 or more** out of 10;
- there are no open bugs of severity `critical` (for example a token stored outside memory, a secret in the bundle, or a weakened sign-in flow) or `high` (for example missing TDD evidence, tests that do not catch deliberately broken code, a WCAG 2.2 A/AA failure, hand-written API types, the UI deciding user type, or an unhandled `401`/`403`).

---

## 14. Troubleshooting Claude Code

| Symptom | Likely cause and fix |
|---|---|
| `@planner` does not appear in the startup header | Check the files are in `.claude/agents/` at the repository root and that you started Claude Code from that folder. If the `agents` folder was created while a session was running, restart Claude Code. |
| An agent is silently ignored | The frontmatter is invalid: the first line must be `---`, and `name` and `description` are required. Run `claude --debug` to see why a file was skipped. |
| "Agent would be spawned with zero tools" | A tool name in the `tools:` line is misspelled. Use Claude Code names such as `Read, Write, Edit, Bash, Grep, Glob`. |
| The Evaluator has no browser tools | The folder has not been trusted, so its Playwright server was skipped. Accept the trust prompt, or run `claude --debug` to see the reason. |
| Constant permission prompts | Add allow rules as in Step 5.4. |
| The Planner cannot ask you questions | It was started as a subagent instead of the main session. Restart with `claude --agent planner`. |
| A rule does not seem to apply | Path-scoped rules only load when a matching file is touched. Run `/context` to see what is loaded, check the rule's `paths:` globs match your folder layout, and make sure its frontmatter starts on the first line. Anything that must always apply belongs in `CLAUDE.md`. |
| A skill is not used | Check its `description` says clearly when to use it, and that the sprint contract lists it in `relevantSkills`. |
| A sprint fails for missing TDD evidence | The Generator wrote code before tests or did not record the red/green runs. The retry will ask it to fix this; check `checks.tdd` in the evaluation file for which ACs were affected. |
| The Evaluator's TDD checks fail to run | They use `git worktree` under `/tmp` and may need `npm ci` there. Make sure the `test(...)` commits exist locally and that `Bash(git worktree *)` is allowed (Step 5.4). |
| The lint hook does not run | Run `git config core.hooksPath .githooks` in the repository root. If Git says the hook is not executable, run `chmod +x .githooks/pre-commit`. |
| A commit fails with "Lint failed" | Fix the problems it lists (`npx eslint --fix <file>` fixes many), `git add` the files again and commit again. Don't bypass the hook. |
| The hook says a check was skipped | The tool is not installed or configured yet (run `npm install` for ESLint; install yamllint or Hadolint). Skipped checks still run in CI. |
| Claude says a file or command is protected | That is the protection working (Step 5.4). Make the change yourself, or, if the rule is wrong, change `.claude/settings.json` or `.claude/hooks/protect-files.sh` in a reviewed pull request. |
| Every tool call is blocked with "needs jq" | Install `jq` (for example `brew install jq`), or make sure `python3` is available. |
| Claude asks before editing a config file | Tier 3 files need your approval. Check the change and approve it, or say no. |
| `fatal: '<branch>' is already checked out` | That branch is open in another worktree. Use a different branch, or work in that worktree (`git worktree list` shows where). |
| Old worktree folders in `/tmp` or next to the repository | Remove them with `git worktree remove <folder>`, or `git worktree prune` if the folders are already deleted. |
| The hook says "Snyk checks are off" | That's the default. Turn them on for yourself with `git config hooks.snyk true` (section 9). |
| "Snyk ... skipped: the Snyk CLI is not installed" or "could not run" | Install the Snyk CLI and run `snyk auth`, and check your network. By default the commit still goes through with a warning. |
| A commit is blocked by a Snyk issue | Upgrade the affected dependency if a fix exists, or agree a justified ignore in `.snyk` with a reason and expiry. Don't switch Snyk off to get round it. |
| Wrong model used | Check the `model:` line in each agent file (`opus`, `sonnet`, `haiku` or `inherit`) and whether your organisation restricts models. Run `/tasks` while an agent is running to see its model. |

For more on subagents, see the Claude Code documentation: https://code.claude.com/docs/en/sub-agents
