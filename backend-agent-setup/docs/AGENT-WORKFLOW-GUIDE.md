# Multi-Agent Build Workflow: Step-by-Step Guide

This guide explains how to use the **Planner**, **Generator** and **Evaluator** agents to build features in the user-provisioning backend (Spring Boot API). It is written so that someone new to the repository, or to Claude Code, can follow it from start to finish.

**Contents**

1. [What this is](#1-what-this-is)
2. [How project knowledge is organised](#2-how-project-knowledge-is-organised)
3. [Test-driven development (TDD)](#3-test-driven-development-tdd)
4. [Prerequisites](#4-prerequisites)
5. [One-time set-up](#5-one-time-set-up)
6. [Running a build cycle](#6-running-a-build-cycle)
7. [Building the API: first steps and adding endpoints](#7-building-the-api-first-steps-and-adding-endpoints)
8. [Using Git worktrees](#8-using-git-worktrees)
9. [Snyk security checks (off by default)](#9-snyk-security-checks-off-by-default)
10. [When things go wrong](#10-when-things-go-wrong)
11. [Rules everyone should know](#11-rules-everyone-should-know)
12. [File reference](#12-file-reference)
13. [Troubleshooting Claude Code](#13-troubleshooting-claude-code)

---

## 1. What this is

Instead of asking one AI assistant to "just build the feature", the work is split between three agents with separate jobs:

| Agent | Role | What it produces |
|---|---|---|
| **Planner** | Orchestrator. Turns your short request into a spec, splits it into sprints, runs the build loop, and asks you when a decision is needed. | `specs/product-spec.json`, `sprints/status.json`, `sprints/sprint-NN/contract.json` |
| **Generator** | Implementer. Builds one sprint at a time, writes tests, commits, and self-checks its work. | Source code, tests, migrations, `implementation-status.json`, `self-eval.json` |
| **Evaluator** | Skeptical QA. Builds and runs the service, tests it (auth, audit logs, failure paths, security, API contract), and grades it. | `sprints/sprint-NN/evaluation-RR.json` |

All three follow `CLAUDE.md`, which is the **single source of truth** for architecture, security, audit logging and working rules. If an agent file and `CLAUDE.md` disagree, `CLAUDE.md` wins. Detailed rules are split into smaller files that load only when needed; see section 2.

### How the loop works

```
You ──(1-4 sentence request)──► PLANNER
                                  │  writes spec, asks open questions
You ──("good to go")────────────► │
                                  │  writes sprint contract
                                  ├──► GENERATOR  builds sprint, commits, writes self-eval
                                  │         │
                                  │◄────────┘  (or "NEEDS-DECISION" → Planner asks you)
                                  ├──► EVALUATOR  builds, runs, tests, grades
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
| 1. Core rules | `CLAUDE.md` (repository root) | Always, in every session and every agent | Overview, stack, architecture, data ownership, non-negotiable security rules, commands, rules for Claude, and where to find the layers below |
| 2. Area rules | `.claude/rules/*.md` | Automatically, when an agent works on a file matching the rule's `paths:` | Detailed rules for one area: audit logging, LDAP, Futures Database, Okta, testing, deployment and so on |
| 3. Procedures | `.claude/skills/<name>/SKILL.md` | When the task needs it, or preloaded into an agent | Step-by-step how-tos: `tdd-cycle`, `test-infrastructure`, `add-endpoint`, `provisioning-flow`, `add-audit-event`, `ldap-gateway`, `futures-persistence`, `sprint-rubric` |
| 4. Reference | `docs/reference/`, `docs/open-questions.md` | Only when an agent opens the file | Long reference material (the audit record schema) and decisions still to be made |

### Rule files and when they load

| Rule file | Covers | Loads when an agent touches |
|---|---|---|
| `tdd.md` | Test-first rules: red → green → refactor, commits, evidence | all production and test code, `src/main/resources/` |
| `code-style.md` | Java 25 and Spring Boot 4 conventions | any `.java` file, `pom.xml` |
| `user-classification.md` | User type (provisioning) and internal/external classification by email domain (role management) | `service/`, `api/` |
| `transactions.md` | Mandatory JSM/Jira ticket, separate transaction ID, mandatory provisioning fields, external users in URM | `api/`, `service/`, `audit/`, `futures/`, tests |
| `provisioning.md` | Ordered OpenDJ + Futures Database writes, compensation | `service/`, `ldap/`, `futures/` |
| `security-okta.md` | Resource server, roles, `401`/`403`, auth auditing, CORS | `security/`, `api/`, `config/` |
| `audit-logging.md` | Auditable events, fields, JSON format, MDC, correlation IDs | all production Java, `logback*.xml`, `application*.yml` |
| `log-shipping.md` | Daily rotation, S3 shipping, retention | `audit/`, `logback*.xml` |
| `ldap.md` | Spring LDAP, injection prevention | `ldap/` |
| `futures-db.md` | JPA, migrations | `futures/`, `db/migration/` |
| `api-contract.md` | springdoc, spec-sync, breaking changes | `api/`, `exception/` |
| `testing.md` | Unit, authorisation, audit and failure-path tests | `src/test/` |
| `deploy.md` | GitHub Actions, Argo CD, OpenShift | `deploy/`, `Dockerfile`, `.github/workflows/` |

### Skills and when they are used

| Skill | Use it when | Covers |
|---|---|---|
| `tdd-cycle` | Every acceptance criterion (preloaded into the Generator) | Red → green → refactor, commits, evidence |
| `test-infrastructure` | Sprint 0, and any test needing containers, mock operators, audit capture or outages | Testcontainers (Futures Database, OpenDJ, S3), `TestApplication`, `MockOperators`, `AuditLogCapture`, `Outages` |
| `add-endpoint` | Adding or changing a REST endpoint | Tests for `401`/`403`/validation/audit first, then DTOs, controller, OpenAPI |
| `provisioning-flow` | Anything writing to both OpenDJ and the Futures Database | Ordered steps, compensation, failure-path tests |
| `add-audit-event` | Adding or changing an audited action | Audit record tests first, then emitting the record |
| `ldap-gateway` | Reading or writing LDAP entries, groups or role memberships | Config-driven DNs, injection-safe filters, error mapping, OpenDJ container tests |
| `futures-persistence` | Adding or changing a table, entity, repository or query | Migration first, explicit mapping with `ddl-auto: validate`, constraint and query tests |
| `sprint-rubric` | Self-check and grading (preloaded into Generator and Evaluator) | Scores, pass threshold, severity guide |

### How the agents use the layers

- **Planner** does not edit source files, so rules would not load for it automatically. It reads the relevant rule files and `docs/open-questions.md` itself, and lists them in each sprint contract as `relevantRules` and `relevantSkills`.
- **Generator** reads the rules and skills named in the contract before it starts. Other rules load automatically as it edits matching files. The `tdd-cycle` skill (its working loop) and the `sprint-rubric` skill (its self-check) are preloaded.
- **Evaluator** reads the rules named in the contract plus `testing.md` and `tdd.md`, because it reviews rather than edits. The same `sprint-rubric` skill is preloaded, so the Generator and Evaluator grade the same way.

### Keeping the layers healthy

- **If breaking a rule would be a security or compliance problem, it stays in `CLAUDE.md`.** A path-scoped rule only loads when a matching file is touched.
- **Keep `CLAUDE.md` under 100 lines.** It is loaded into every session, so every line must apply to every task. When it grows, move detail into a rule file. Do not describe what Claude can read from the code or what the settings and hooks already enforce.
- **Use plain Markdown links, not `@path` imports,** to point at reference docs. Imports load at startup and defeat the purpose.
- **One topic per rule file,** named for the area, with `paths:` that match where that code lives. If the source layout changes, update the `paths:` globs.
- **Check what is loaded** by running `/context` in a Claude Code session.

### Maintaining the layers: step by step

Use these procedures whenever the rules change. Make the change on a branch and review it like code, because it changes how every agent behaves.

**A. An open question has been answered**

1. Open `docs/open-questions.md` and find the question. The last column names the rule file to update.
2. Add the decision to that rule file in `.claude/rules/`, replacing any "still open" line. Write it as a rule, for example "Subdomains of an internal domain are internal".
3. If the answer is a value that differs by environment (domains, bucket names, issuer URLs), write the rule as "comes from configuration key `x.y.z`". Never put the value itself in the rule file.
4. Delete the row from `docs/open-questions.md`.
5. Only touch `CLAUDE.md` if the decision affects every task.
6. Commit: `docs(rules): record decision on <topic>`.

**B. Adding a new rule for an area**

1. Check whether an existing rule file already covers the area. If so, add to it instead.
2. Create `.claude/rules/<area>.md`. The first line must be `---`, followed by a `paths:` list of globs for where that code lives, then `---`:

   ```markdown
   ---
   paths:
     - "src/main/java/**/notification/**"
   ---
   # Notifications

   - Rule one.
   - Rule two.
   ```

3. Keep it to one topic. Link to long reference material in `docs/reference/` with a normal Markdown link, not `@path`.
4. Add a row to the "Rule files and when they load" table in this section. `CLAUDE.md` does not list rule files.
5. Verify it loads (procedure E).

**C. Adding a new skill (procedure)**

1. Create the folder `.claude/skills/<skill-name>/` and a file called exactly `SKILL.md` inside it.
2. Start the file with frontmatter: `name` (the same as the folder name) and a `description` that says clearly **when** to use it, for example "Use this whenever you add or change ...".
3. Write the steps in order, and name the rule files it relies on.
4. Add it to the skills table in this section. It does not need listing in `CLAUDE.md`: Claude sees every skill's description automatically.
5. If an agent should always have it, add it to that agent's `skills:` list; otherwise the Planner names it in sprint contracts under `relevantSkills`.

**D. `CLAUDE.md` is getting long**

1. Find the section that only matters for part of the codebase.
2. Move it into the matching rule file (or create one, procedure B).
3. Do not leave an index entry behind: rules load by their `paths:`, not from `CLAUDE.md`.
4. Keep anything whose breach would be a security or compliance problem in `CLAUDE.md`.

**E. Checking that a rule actually loads**

1. Start a normal session: `claude`.
2. Ask Claude to open a file in the area, for example "Open a class in `ldap/` and summarise it".
3. Run `/context`. The matching rule (here `ldap.md`) should be listed; unrelated rules (for example `log-shipping.md`) should not.
4. If it is missing, check the `paths:` globs match the real folder names and that `---` is on the very first line of the file. Run `claude --debug` if it still does not appear.

**F. The package layout changes**

1. Search `.claude/rules/` for the old folder name.
2. Update every `paths:` glob that uses it, and the table in section 2 of this guide.
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
| **Planner** | Writes concrete `testScenarios` (given / when / then, with a test level) for every acceptance criterion in the sprint contract, including failure, denial paths. |
| **Generator** | Runs the red → green → refactor loop for each AC in order, commits the failing tests before the code, and records the red and green runs as evidence. Fixes on a retry start with a failing test that reproduces the bug. |
| **Evaluator** | Checks the evidence and the git history, re-runs the tests at the test commit to prove they really failed, and deliberately breaks the code in a temporary copy to prove the tests catch it. Missing TDD evidence is a `high` bug and fails the sprint. |

### Example test scenario in a contract

```json
{ "acId": "AC2", "scenarios": [
  { "given": "an operator with the editor role", "when": "they POST a new user", "then": "the API returns 403 and an ACCESS_DENIED audit record is written", "level": "slice" } ] }
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
    "red":   { "command": "./mvnw -q test -Dtest=UserControllerTest", "result": "2 failed: ...", "commit": "a1b2c3d" },
    "green": { "command": "./mvnw -q test -Dtest=UserControllerTest", "result": "2 passed", "commit": "d4e5f6a" },
    "refactored": true
  }
}
```

A rare genuine exemption (for example, adding a dependency) is recorded as `"tddExempt": "<reason>"`.

### Test levels

| Level | Tool | Use it for | Fast loop? |
|---|---|---|---|
| Unit | JUnit 5 + Mockito | Services, email classification, audit record building, compensation logic | Yes |
| Slice | `@WebMvcTest` (or equivalent) + Spring Security test mock JWTs | Endpoints, validation, `401`/`403`/success | Yes |
| Integration | Containerised OpenDJ and Futures Database (Testcontainers); S3 via LocalStack or a mocked client (open question #12) | LDAP and Futures Database gateways, migrations, full provisioning flows, S3 shipping | Written first, run at the end of each AC |

### How the Evaluator checks TDD

1. Every AC has red and green evidence, or a justified exemption.
2. In `git log`, the `test(...)` commit for each AC comes before its `feat(...)` commit, and test names include the AC id.
3. **Red is real:** it checks out the test commit in a temporary git worktree under `/tmp`, runs those tests, and confirms they fail for the right reason.
4. **Tests protect the behaviour:** in another temporary worktree it deliberately breaks the code (for example: flip a role check, remove an audit call, loosen the email domain match) and confirms a test fails.
5. No tests were deleted, skipped (`@Disabled`) or weakened.

Your working copy is never changed by these checks. Section 8 explains worktrees in more detail.

### What you should look at

When reviewing a sprint, open the `tdd` section of `implementation-status.json` and `checks.tdd` in the evaluation file, and skim `git log --oneline` for the test → feat pattern. Read a few of the tests: they should describe behaviour a user or operator cares about, not implementation details.

---

## 4. Prerequisites

Make sure you have the following before you start:

1. **Claude Code** installed and signed in. See https://code.claude.com/docs/en/overview.
2. **The backend repository** cloned locally, with `CLAUDE.md` at the repository root.
3. **Java 25** and the committed **Maven wrapper** (`./mvnw`) working. Check with `./mvnw -v`.
4. **Docker** (or a compatible container runtime) running. The Generator and Evaluator start local OpenDJ and Futures Database containers for tests (Testcontainers); S3 uses LocalStack or a mocked client (open question #12). They are never allowed to use real environments.
5. **Git** configured with your name and email. The Generator commits its work on your local branch.
6. **jq** (or `python3`), used by the Claude Code hook that protects files (Step 5.3). For example: `brew install jq`.
7. **Optional:** yamllint and Hadolint, used by the pre-commit lint hook for YAML and Dockerfiles. Without them those checks are skipped locally and still run in CI.
8. **Optional:** the Snyk CLI, only if you want to turn on the Snyk security checks (section 9).

> **Important:** Never point the local profile at real LDAP, Futures Database, Okta or S3. The agents are instructed not to, but your local configuration should make it impossible.

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
│   │   ├── api-contract.md
│   │   ├── audit-logging.md
│   │   ├── code-style.md
│   │   ├── deploy.md
│   │   ├── ldap.md
│   │   ├── log-shipping.md
│   │   ├── futures-db.md
│   │   ├── provisioning.md
│   │   ├── security-okta.md
│   │   ├── tdd.md
│   │   ├── testing.md
│   │   └── user-classification.md
│   └── skills/                    ← procedures, loaded when needed
│       ├── tdd-cycle/SKILL.md
│       ├── test-infrastructure/   (SKILL.md + templates/)
│       ├── add-audit-event/SKILL.md
│       ├── add-endpoint/SKILL.md
│       ├── ldap-gateway/SKILL.md
│       ├── futures-persistence/SKILL.md
│       ├── provisioning-flow/SKILL.md
│       └── sprint-rubric/SKILL.md
├── docs/
│   ├── AGENT-WORKFLOW-GUIDE.md    ← this file
│   ├── open-questions.md
│   └── reference/
│       └── audit-record-schema.md
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

**About the lint hook.** Every commit, by a person or an agent, runs `.githooks/pre-commit`. It lints only the files being committed: Checkstyle when Java files are staged (skipped with a note until Checkstyle is configured in `pom.xml`; see open question #13), yamllint on YAML files and Hadolint on Dockerfiles.

- If it fails, fix what it reports, `git add` again and commit again.
- Run it by hand with `bash .githooks/pre-commit`, or `bash .githooks/pre-commit --all` for every file.
- Tests do not run here, because the agents deliberately commit failing tests (section 3).
- Never bypass it with `--no-verify` or `-n`.
- Optional **Snyk** security checks run in the same hooks, but they are off by default (section 9).
- Other checks before commit or push, and whether to use a hook manager, are still open (see `docs/open-questions.md`).

> **GitHub Copilot users:** a Copilot version of the same agents lives in `.github/agents/*.agent.md`. Claude Code ignores that folder and Copilot ignores `.claude/agents/`, so both can live in the repository. This guide covers Claude Code only.

### Step 5.3: Review what Claude can and cannot touch

The zip includes `.claude/settings.json` and a PreToolUse hook, `.claude/hooks/protect-files.sh`. Together they decide which files Claude can read and edit, and which commands it can run, for you and for every agent.

**Four tiers of files**

| Tier | What | Examples in this repository |
|---|---|---|
| 1. Never read | Secrets | `.env`, `.env.*` (but `.env.example` is fine), keys and keystores (`*.pem`, `*.key`, `*.p12`, `*.jks`); `~/.ssh`, `~/.aws`, `~/.kube`, `~/.docker/config.json`, `~/.m2/settings.xml`, `~/.npmrc`, the Snyk token (`~/.config/configstore/snyk.json`) |
| 2. Never edit | Files a person must change | `.claude/settings.json`, `.claude/hooks/**`, `.githooks/**`, `.git/**`, `.github/workflows/**`, `deploy/**`; `mvnw`, `mvnw.cmd`, `.mvn/wrapper/**`; migrations already on `main` (add a new migration instead) |
| 3. Ask first | Configuration and project guidance: Claude may change them, but you approve each change | `CLAUDE.md`, `.claude/rules/**`, `.claude/agents/**`, `.claude/skills/**`, `docs/**`, `Dockerfile`, `.gitignore`, `pom.xml`, `src/main/resources/application*.yml`, Checkstyle config. Reading log files also asks, because they can contain personal data. |
| 4. Free to edit (auto-approved) | Everyday work: Claude edits these without asking | `src/main/java/**`, `src/test/**`, new migrations, `specs/**`, `sprints/**` |

**Auto-approved (no prompt)**

| Kind | Allowed without asking |
|---|---|
| File edits | `src/**`, `specs/**`, `sprints/**` (tier 4). Tier 2 and 3 files inside these folders stay protected, because deny and ask rules always win over allow (for example `src/main/resources/application*.yml` still asks, and a merged migration is still refused). |
| Build and test | `./mvnw *` (build and tests; `deploy` is still blocked), `docker *` (containers for tests; `docker login` is still blocked), `curl http://127.0.0.1:8080/*` (the local API only) |
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

### Step 5.4: Check the agents are recognised

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

Type a short request. Focus on the outcome, not the implementation. For example:

> Add an endpoint that lets an operator provision a new internal user of the user type they chose (Government, Forestry or Nature), store their details in the Futures Database, assign their roles in OpenDJ, and audit every step including failures.

### Step 6.3: Review the spec and answer the open questions

The Planner writes `specs/product-spec.json` and replies with:

- a short summary of the features and how they are split into sprints (up to 8), and
- a list of **open questions** that block the work. These come from `docs/open-questions.md`: the admin/editor permission matrix, internal email domains, LDAP and Futures Database schemas, Okta claim path, OpenDJ/Futures Database write order, and so on.

What to do:

1. Read the summary. Open `specs/product-spec.json` if you want the detail.
2. Answer every open question you can. If you do not know, say so. The Planner will either scope that part as configurable (no guessed values) or hold that sprint back.
3. Ask for changes if the scope or sprint order looks wrong.

### Step 6.4: Approve with "good to go"

When you are happy with the spec, reply:

> good to go

Nothing is built until you say this. The Planner then:

1. creates or updates `sprints/status.json`, continuing the sprint numbering from any previous cycle, and
2. writes the first sprint contract to `sprints/sprint-NN/contract.json`.

### Step 6.5: Let the sprint loop run

From here the Planner runs the loop on its own:

1. **Generator** works through the acceptance criteria one at a time, test-first: it writes the failing tests from the contract's `testScenarios` and commits them, writes the minimum code to pass and commits it, then refactors. Finally it runs `./mvnw clean verify` and writes `self-eval.json`.
2. **Evaluator** creates `evaluation-RR.json` straight away, then builds, starts and tests the service, and checks the TDD evidence (section 3). It records each acceptance criterion as it goes and finishes with scores and a `PASS` or `FAIL` verdict.
3. **Planner** checks the evaluation file is complete and valid, then:
   - on **PASS**, marks the sprint done and moves to the next one;
   - on **FAIL**, sends the Generator back with the evaluation file to fix every listed bug (up to 5 attempts in total).

You may be asked to approve commands (for example Docker or Maven) unless the command is pre-approved in `.claude/settings.json` (Step 5.3).

### Step 6.6: Answer decisions when asked

If the Generator hits something it cannot decide safely, such as a TBC item, an architectural change or a major new dependency, it stops with a **NEEDS-DECISION** report. The Planner shows you the questions, the options and their impact.

Reply with your decision. The Planner records it in the sprint contract and restarts the sprint. The Generator will never guess or bake a guess into committed code.

### Step 6.7: Review the result of each sprint

When a sprint passes, the Planner gives you a short summary. Before moving on, it is good practice to check:

| Where to look | What to check |
|---|---|
| `git log --oneline` | The `test(...)` → `feat(...)` pattern for each acceptance criterion. |
| `git diff` | The commits for the sprint. Look for `!` and `BREAKING` in commit messages. |
| `sprints/sprint-NN/evaluation-RR.json` | Scores, bugs found and fixed, `apiContract` changes. |
| `sprints/sprint-NN/implementation-status.json` | The `tdd` red/green evidence per acceptance criterion, assumptions made, anything `unverified`. |
| `openapi.json` diff | Any change that could break the frontend. |

The agents make mistakes. The Evaluator reduces them but does not replace human code review.

### Step 6.8: Finish the cycle

When no sprints remain, the Planner sets `buildStatus` to `complete` in `sprints/status.json` and gives you a final summary: sprints done and blocked, API contract changes (breaking ones highlighted), and anything that could not be verified.

Then:

1. **Record the decisions.** The Planner tells you which open questions were answered and which rule file each answer belongs in. Add each decision to that rule file in `.claude/rules/`, then delete the question from `docs/open-questions.md`. `CLAUDE.md` only changes if a decision affects every task. The agents do not edit these files unless you ask.
2. **Review the whole branch** as you would any pull request.
3. **Push and open a pull request** yourself. CI then builds the service and, on merge, the spec-sync workflow opens a PR in the frontend repository.
4. **Tell the frontend team** about any breaking API change, even though the spec-sync PR will show it.

---

## 7. Building the API: first steps and adding endpoints

This section is the practical walkthrough: how to start the backend, hand the first API contract to the UI, and the repeatable routine for adding more endpoints.

### First steps (once)

1. **Set up** as in sections 4 and 5: install the prerequisites, add the files on a branch.
2. **Settle the blocking open questions** in `docs/open-questions.md`, or be ready to answer them when the Planner asks. The most urgent are:
   - #7: the permission matrix;
   - #8: Okta roles in the token;
   - #1: internal email domains;
   - #2 and #3: the LDAP and Futures Database schemas;
   - #9: the write order between OpenDJ and the Futures Database;
   - #12: S3 in tests;
   - #13: the Java code style.
3. **Start the Planner** with `claude --agent planner` and ask for the foundation, for example:

   > Set up the backend foundation: the shared test infrastructure, Okta resource-server security with admin, editor and read-only viewer roles, correlation IDs and structured audit logging, and a health endpoint.

4. The Planner makes **Sprint 0: test infrastructure** the first sprint. Review the summary, answer its questions, and reply `good to go`.
5. **Review each passed sprint** (Step 6.7) and finish the cycle (Step 6.8).

### Handing the API contract to the UI

The UI builds its data pages only from `openapi.json`. As soon as the first endpoints exist:

- **Long term:** ask the Planner for the **spec-sync workflow** (it is a CI change, so it must be requested explicitly). On merge to `main`, it opens a pull request with the updated spec in the frontend repository.
- **Until then:** a person copies the generated `openapi.json` into the frontend repository on a `spec-sync/...` branch (see the frontend guide, section 7).

Every breaking change to the contract must be flagged. The agents do this in the commit message (`feat(...)!: ... BREAKING: ...`) and in the evaluation file.

### Adding an endpoint (repeat as needed)

1. **Create a branch**, for example `git checkout -b feature/list-users`.
2. **Start the Planner** and describe the behaviour, who may use it, and what must be audited. For example:

   > Add an endpoint to list provisioned users for admins and editors, with name, email, user type and roles. Editors must not see disabled users. Audit access denials.

   > Add an endpoint for admins to provision a new internal user of the chosen user type (Government, Forestry or Nature): store the details in the Futures Database, assign roles in OpenDJ, compensate if the second write fails, and audit every step.

3. **The Planner:**
   - writes the spec and contract, including test scenarios, audit events and API contract impact;
   - picks the skills (`add-endpoint`, `provisioning-flow`, `ldap-gateway`, `futures-persistence`, `add-audit-event`).
4. **Reply `good to go`.** The Generator and Evaluator build it test-first.
5. **Push the branch and open a pull request.** Once merged, the spec reaches the UI through the spec-sync route above.

### Tips

- **One endpoint or flow per sprint.** Provisioning flows that touch both OpenDJ and the Futures Database are usually a sprint on their own.
- **Always say who may call it** (`admin`, `editor`, `viewer`; a `viewer` may only read) until the permission matrix is agreed.
- **Build what the UI needs first.** When the UI Planner reports a backend dependency, it tells you exactly which operation and fields are missing; use that as your request here.

---

## 8. Using Git worktrees

A Git worktree is a second working folder for the same repository, with its own branch checked out. Worktrees let two things happen at once without disturbing each other. They share the same Git history, so there is nothing to clone or sync.

```bash
git worktree list                                             # show all worktrees
git worktree add ../backend-users -b feature/users            # new folder + new branch
git worktree remove ../backend-users                          # delete the folder when done
git worktree prune                                            # tidy up after folders deleted by hand
```

### How the agents use worktrees today

Only the **Evaluator** uses worktrees, for its TDD checks (section 3):

- **Red is real:** it checks out each acceptance criterion's `test(...)` commit in `/tmp/tdd-red` and runs those tests to prove they failed.
- **Tests protect the behaviour:** in another worktree at `HEAD`, it deliberately breaks a piece of the code and confirms a test fails.

It removes both worktrees afterwards. Your working folder and branch are never touched.

The **Generator** builds in your normal working folder, and sprints run one at a time.

### When you might use worktrees yourself

**1. Your own work while the agents run (recommended).** Leave the agents working in the main folder and do your own reviews, experiments or small fixes in a separate worktree on a different branch. Nothing you do there can disturb a sprint in progress.

**2. Two independent features in parallel (use with care).** Run a separate Planner session in each worktree, each on its own feature branch:

```bash
git worktree add ../backend-users  -b feature/users
git worktree add ../backend-audit  -b feature/audit-export
cd ../backend-users && claude --agent planner
```

Only do this when the features are truly independent, and follow these rules:

- **Sprint numbers:** each Planner picks the next number after the highest one it can see, so two parallel Planners would pick the same numbers. Give each one its own range in your request, for example "Use sprint numbers 20–29" and "Use sprint numbers 30–39".
- **One planning cycle per branch.** Never run two Planners on the same branch; Git does not allow the same branch to be checked out in two worktrees anyway.
- **Expect merge conflicts in shared files:** `specs/product-spec.json`, `sprints/status.json`, shared configuration classes and **database migrations**. Merge one branch into `main` first, then update the second branch from `main` and resolve conflicts, keeping both sets of entries in `status.json` and the spec.
- **Migration numbers:** two branches must never create a migration with the same version (for example both adding `V7__...sql`). Agree the numbers in advance (for example branch A uses `V7`, branch B uses `V8`), or rename the later one before merging. A migration already on `main` can never be renamed or edited.
- **Ports:** Two copies of the API cannot both use port 8080. When running `./mvnw spring-boot:test-run` in a second worktree, pass another port, for example `-Dspring-boot.run.arguments=--server.port=8081`, and run evaluations one at a time.
- **Dependencies:** Maven's `target/` folder is separate per worktree, so the first build in a new worktree takes a little longer.

### Things to know

- **Same protections everywhere.** When you start Claude Code inside a worktree, that worktree is the project folder. `.claude/settings.json`, the file-protection hook and the rules all apply there as normal.
- **The lint hook applies too.** `core.hooksPath` is stored in the repository's Git configuration, which all worktrees share, so the pre-commit lint hook runs in every worktree.
- **Local files are not copied.** Git-ignored files such as `.env`, `target/` and `CLAUDE.local.md` exist only in the folder where you created them.
- **Clean up** finished worktrees with `git worktree remove <folder>`. If a folder was deleted by hand, run `git worktree prune`.

---

## 9. Snyk security checks (off by default)

Snyk checks for known vulnerabilities and security problems. The checks are built into the Git hooks, but they are **switched off by default**. Anyone can turn them on for their own clone, and the team can turn them on for everyone later.

### What Snyk checks, when turned on

| Check | Command | When it runs | Default once Snyk is on |
|---|---|---|---|
| Dependencies | `snyk test` | On commit, when `pom.xml` is staged | On |
| Infrastructure | `snyk iac test` | On commit, when `deploy/` manifests are staged | On |
| Your own code | `snyk code test` | On push (`.githooks/pre-push`) | **Off.** It uploads your source code to Snyk, so it needs approval first (open question #15). |

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

- **Dependency issue:** upgrade to a fixed version if one exists. Snyk's output says which version fixes it. Changes to `pom.xml` need approval when made by Claude.
- **No fix available yet:** agree a justified ignore in a `.snyk` policy file, with a reason and an expiry date, reviewed like any other change. Only people add ignores.
- **Infrastructure or code issue:** fix it like any other bug. For agent work, the Evaluator records it as a `high` bug.

### Agents and Snyk

- Agents can run the Snyk checks, but **cannot turn Snyk on or off**. `SNYK=...` and `git config hooks.snyk...` are blocked for them.
- They cannot sign in (`snyk auth`), upload a project snapshot (`snyk monitor`), change Snyk configuration or add ignores. They also cannot read the Snyk token, which is protected like other secrets.
- If Snyk blocks an agent's commit, the agent reports the issue instead of working around it.
- The Evaluator runs the Snyk checks only when Snyk is turned on, and records `"off"` otherwise.

---

## 10. When things go wrong

### A sprint is marked "blocked"

After 5 failed attempts the Planner marks the sprint `blocked` and writes `sprints/sprint-NN/blocked.json` with the unresolved bugs. It only continues with later sprints that do not depend on the blocked one.

What to do:

1. Read `blocked.json` and the latest `evaluation-RR.json`.
2. Decide whether the contract was unrealistic, a decision is missing, or the code needs a human.
3. Either fix it yourself, or change the contract and ask the Planner to retry the sprint, for example: "Retry sprint 10 with the updated contract."

### The evaluation file is missing or stuck on "IN_PROGRESS"

The Planner retries the Evaluator up to 2 times. If it is still incomplete, the sprint is marked `in-review` and the Planner stops and reports the problem. Usually the cause is that the app or containers could not start. Check Docker is running and try again.

### The build or containers will not start

The Evaluator records a FAIL with all scores at 0 and the error output. Common causes:

- Docker is not running.
- Ports (for example 8080) are already in use.
- The shared test infrastructure does not exist yet. Sprint 0 creates it with the `test-infrastructure` skill; the Evaluator logs a bug if it is missing.

### You want to stop

Press `Esc` to interrupt Claude Code at any point. Everything done so far is in files and commits, so you can restart later with `claude --agent planner` and ask it to continue from `sprints/status.json`.

---

## 11. Rules everyone should know

These come from `CLAUDE.md` and the agent files. They apply to people as much as to agents:

1. **Test first.** No production code without a failing test that needs it.
2. **No real environments.** Local, containerised or mocked targets only.
3. **No secrets in the repository.** No credentials, hostnames, DNs, internal email domains or bucket names, even as examples.
4. **Security is never weakened to pass a test, and tests are never deleted, disabled or weakened to pass a build.**
5. **No changes to `.github/workflows/` or `deploy/`** unless explicitly asked for in the sprint contract.
6. **Every breaking API change is flagged**, because the frontend is released separately.
7. **Open questions are answered by people, not guessed by agents.**
8. **Only the Evaluator writes evaluation files.** A verdict mentioned in chat does not count.
9. **Humans push and merge.** Agents commit locally only.
10. **Never bypass the lint hook.** No `--no-verify` or `-n`, and no loosening the lint rules to get a commit through.
11. **Protected files stay protected.** If Claude is blocked, a person makes the change; nobody works around the rules.
12. **Snyk is off unless a person turns it on.** Agents never change the Snyk switches or add ignores; nobody switches Snyk off to get round an issue.

---

## 12. File reference

| File | Written by | Purpose |
|---|---|---|
| `CLAUDE.md` | People | Core rules and source of truth; always loaded. |
| `.githooks/pre-commit` | People | Pre-commit lint hook, plus optional Snyk dependency and infrastructure checks (turned on with `git config core.hooksPath .githooks`). |
| `.githooks/pre-push` | People | Optional Snyk code check on push. |
| `.githooks/snyk.conf`, `.githooks/snyk-lib.sh` | People | Snyk team defaults (off) and shared helper. Personal settings use `git config hooks.snyk...` (section 9). |
| `.claude/settings.json` | People | Permission rules: allowed, ask-first and denied files and commands (Step 5.3). |
| `.claude/hooks/protect-files.sh` | People | PreToolUse hook that protects secrets, critical files and real environments, including through shell commands (Step 5.3). |
| `.claude/rules/*.md` | People | Detailed area rules; loaded when matching files are touched. |
| `.claude/skills/*/SKILL.md` | People | Step-by-step procedures; loaded when needed. |
| `docs/open-questions.md` | People | Decisions still to be made. |
| `docs/reference/audit-record-schema.md` | People | Full audit record schema and example. |
| `.claude/agents/planner.md` | People | Planner definition. |
| `.claude/agents/generator.md` | People | Generator definition. |
| `.claude/agents/evaluator.md` | People | Evaluator definition. |
| `specs/product-spec.json` | Planner | Full spec for the current cycle, including open questions. |
| `sprints/status.json` | Planner | Overall tracker: sprint list, status, retries. |
| `sprints/sprint-NN/contract.json` | Planner | What the sprint must deliver and how it is judged. |
| `sprints/sprint-NN/implementation-status.json` | Generator | Live per-criterion progress, TDD red/green evidence, assumptions. |
| `sprints/sprint-NN/self-eval.json` | Generator | Generator's own check before QA. |
| `sprints/sprint-NN/evaluation-RR.json` | Evaluator | Scores, bugs and verdict for attempt RR. |
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
- Functionality, Audit & Observability and Craft & TDD each score **6 or more** out of 10;
- Security scores **8 or more** out of 10;
- there are no open bugs of severity `critical` (for example a security bypass or leaked secret) or `high` (for example missing TDD evidence, tests that do not catch deliberately broken code, a missing audit event or an unflagged breaking API change).

---

## 13. Troubleshooting Claude Code

| Symptom | Likely cause and fix |
|---|---|
| `@planner` does not appear in the startup header | Check the files are in `.claude/agents/` at the repository root and that you started Claude Code from that folder. If the `agents` folder was created while a session was running, restart Claude Code. |
| An agent is silently ignored | The frontmatter is invalid: the first line must be `---`, and `name` and `description` are required. Run `claude --debug` to see why a file was skipped. |
| "Agent would be spawned with zero tools" | A tool name in the `tools:` line is misspelled. Use Claude Code names such as `Read, Write, Edit, Bash, Grep, Glob`. |
| Constant permission prompts | Add allow rules as in Step 5.3. |
| The Planner cannot ask you questions | It was started as a subagent instead of the main session. Restart with `claude --agent planner`. |
| A rule does not seem to apply | Path-scoped rules only load when a matching file is touched. Run `/context` to see what is loaded, check the rule's `paths:` globs match your folder layout, and make sure its frontmatter starts on the first line. Anything that must always apply belongs in `CLAUDE.md`. |
| A skill is not used | Check its `description` says clearly when to use it, and that the sprint contract lists it in `relevantSkills`. |
| A sprint fails for missing TDD evidence | The Generator wrote code before tests or did not record the red/green runs. The retry will ask it to fix this; check `checks.tdd` in the evaluation file for which ACs were affected. |
| The Evaluator's TDD checks fail to run | They use `git worktree` under `/tmp`. Make sure the `test(...)` commits exist locally and that `Bash(git worktree *)` is allowed (Step 5.3). |
| The lint hook does not run | Run `git config core.hooksPath .githooks` in the repository root. If Git says the hook is not executable, run `chmod +x .githooks/pre-commit`. |
| A commit fails with "Lint failed" | Fix the problems it lists, `git add` the files again and commit again. Don't bypass the hook. |
| The hook says a check was skipped | The tool is not installed or configured yet (configure Checkstyle in `pom.xml`, see open question #13; install yamllint or Hadolint). Skipped checks still run in CI. |
| Claude says a file or command is protected | That is the protection working (Step 5.3). Make the change yourself, or, if the rule is wrong, change `.claude/settings.json` or `.claude/hooks/protect-files.sh` in a reviewed pull request. |
| Every tool call is blocked with "needs jq" | Install `jq` (for example `brew install jq`), or make sure `python3` is available. |
| Claude asks before editing a config file | Tier 3 files need your approval. Check the change and approve it, or say no. |
| `fatal: '<branch>' is already checked out` | That branch is open in another worktree. Use a different branch, or work in that worktree (`git worktree list` shows where). |
| Old worktree folders in `/tmp` or next to the repository | Remove them with `git worktree remove <folder>`, or `git worktree prune` if the folders are already deleted. |
| The hook says "Snyk checks are off" | That's the default. Turn them on for yourself with `git config hooks.snyk true` (section 9). |
| "Snyk ... skipped: the Snyk CLI is not installed" or "could not run" | Install the Snyk CLI and run `snyk auth`, and check your network. By default the commit still goes through with a warning. |
| A commit is blocked by a Snyk issue | Upgrade the affected dependency if a fix exists, or agree a justified ignore in `.snyk` with a reason and expiry. Don't switch Snyk off to get round it. |
| Wrong model used | Check the `model:` line in each agent file (`opus`, `sonnet`, `haiku` or `inherit`) and whether your organisation restricts models. Run `/tasks` while an agent is running to see its model. |

For more on subagents, see the Claude Code documentation: https://code.claude.com/docs/en/sub-agents
