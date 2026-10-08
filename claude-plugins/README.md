# Team agent kits

Two Claude Code plugins that give a repository a test-first sprint workflow: a Planner, Generator and Evaluator agent, step-by-step skills, and a hook that protects secrets and critical files.

| Plugin | For | Install in |
|---|---|---|
| `springboot-api-kit` | Spring Boot APIs (Java, Maven, JPA, OpenAPI) | the backend repository |
| `react-ui-kit` | React UIs (TypeScript, Vite, Vitest, MSW, Playwright) | the frontend repository |

They carry no application's business rules. Each team adds its own in the files that setup copies into the repository.

## Before you start

- Claude Code, and Git.
- `bash` on your `PATH`. On Windows this is Git Bash, which comes with Git for Windows.
- `jq` (recommended) or `python3`. The protect-files hook needs one of them to read tool calls; without either it blocks every call and says so. `jq` is much faster.
- `react-ui-kit` only: Node.js, because the Evaluator drives a browser through the Playwright MCP server (`npx @playwright/mcp`). That server is started for every session in which the plugin is enabled.

## Install

Add this marketplace once, then install the plugin that matches the repository you are in:

```bash
claude plugin marketplace add <owner>/<repo>            # or a Git URL, or a local path to this folder
claude plugin install springboot-api-kit@team-agent-kits --scope local   # in a backend repository
claude plugin install react-ui-kit@team-agent-kits --scope local         # in a frontend repository
```

Use `--scope local`, which enables the plugin for you in this repository only:

- Not `user`: the hook would then run in every repository you open, including ones that do not use the kit.
- Not `project`, at least before setup: it creates `.claude/settings.json`, and setup will not overwrite an existing file, so the permission lists would have to be merged by hand.

## Set up a repository

A plugin can supply skills, agents and hooks. It cannot supply rules, `CLAUDE.md`, permission settings or Git hooks, so those are copied into the repository once:

```
/springboot-api-kit:setup          (or /react-ui-kit:setup)
```

Setup asks which optional packs apply, shows what it will write, and copies:

| Copied to | What it is |
|---|---|
| `CLAUDE.md` | Project instructions, with `SETUP` comments to fill in |
| `.claude/rules/` | One rule file per area; loaded automatically when Claude edits matching files |
| `.claude/settings.json` | Permission lists: what Claude may do freely, must ask for, or may never do |
| `.githooks/` | Pre-commit lint hook and optional Snyk checks |
| `docs/open-questions.md` | Decisions not yet made; agents ask rather than guess |
| `.claude/skills/`, `docs/reference/` | Only for the packs you choose |

Setup never overwrites. If a file already exists and differs, it is left alone and the template is written beside it as `<name>.template` for you to compare and merge.

Then:

1. Fill in every `SETUP` comment in `CLAUDE.md` and the rule files, and delete rules that do not fit.
2. Answer or delete the starter rows in `docs/open-questions.md`, and add your own.
3. Commit the copied files.

Every other developer on the repository then adds the marketplace, installs the plugin at local scope, and runs `git config core.hooksPath .githooks` once per clone. They do not run setup again.

### Optional packs

| Plugin | Pack | Adds |
|---|---|---|
| `springboot-api-kit` | `okta` | Rule for validating Okta tokens and mapping roles |
| `springboot-api-kit` | `audit-s3` | Rules and skills for a structured audit log and application log, rotated daily and shipped to S3, plus the audit record schema |
| `react-ui-kit` | `okta` | Rule and skill for Okta sign-in with PKCE |
| `react-ui-kit` | `sg-design-system` | Rule and skills for the Scottish Government Design System, including building pages from Figma exports |

Add a pack later by running setup again with its name, for example `/springboot-api-kit:setup audit-s3`.

## Use it

Skills and agents are addressed with the plugin name in front:

```bash
claude --agent springboot-api-kit:planner     # plan a feature and run the sprint loop
```

```
/springboot-api-kit:commit
/springboot-api-kit:review-code
/react-ui-kit:a11y-audit
```

The Planner writes a spec and sprint contracts, the Generator builds each sprint test-first, and the Evaluator builds, runs and grades it. Skills used without the agents (commit, review, release check, changelog, bug fix) work on their own.

## What the hooks do

Each plugin registers three hooks.

### Before every file and shell tool call

It decides by path, in four tiers:

| Tier | Examples | Result |
|---|---|---|
| Never read | `.env`, keys, keystores, `~/.ssh`, `~/.aws`, saved browser sessions | Denied |
| Never edit | `.claude/settings.json`, `.githooks/`, CI workflows, `deploy/`, merged migrations, the Maven wrapper, the API spec and generated types | Denied |
| Ask first | `CLAUDE.md`, `.claude/rules/`, `.claude/skills/`, `docs/`, build and lint configuration, reading log files | You confirm each one |
| Free | Source and tests | Normal rules |

It also refuses `git push`, publishing, cloud and cluster CLIs, bypassing Git hooks, and switching Snyk on or off. Those are for a person.

The same hook checks what is being written and who is writing it:

| Check | Trigger | Result |
|---|---|---|
| Secret scan | The text being written contains a private key, an AWS access key, or a GitHub or Slack token | Denied |
| Secret scan, less certain | An address with a user name and password, a signed token (JWT), or a password, key or token written as a literal value. Not applied to tests and mocks, where fake values are normal | You confirm |
| Test guard | An edit adds `@Disabled` or `@Ignore` (API), or `.skip`, `.only`, `.todo`, `.fixme`, `xit`, `xdescribe`, `fit`, `fdescribe` (UI) to a test, or a shell command deletes a test file | You confirm |
| Agent roles | The Generator writes a contract, the status file, the spec or an evaluation; the Evaluator writes anything in the repository except its evaluation file; the Planner writes under `src/` or `e2e/` | Denied |

A subagent cannot answer a confirmation, so "you confirm" stops the Generator and Evaluator outright.

### When a sprint agent finishes

While a sprint is in progress, the Generator is sent back if `self-eval.json` is missing (unless it recorded `needs-decision` or `contract-mismatch`), and the Evaluator is sent back if its newest evaluation file has no `PASS` or `FAIL` verdict. Each is sent back once, then allowed to finish, so a broken sprint cannot loop.

### When a session starts

You are told if neither `jq` nor `python3` is installed, if the repository has not been set up, if the Git hooks are not turned on in your clone, or if `.template` files from setup are still waiting. Claude is told the current sprint and how many open questions remain. It is silent when there is nothing to report.

### Limits

- The secret scan looks at what the file tools write. It does not see text written by a shell command, and it only knows the patterns above; it is a safety net, not a replacement for a secrets scanner in CI.
- The agent role check covers the file tools. The Generator and Evaluator also have a shell, which the existing shell rules narrow but do not close.
- The role check goes by the agent's name, so a project agent of your own called `generator`, `evaluator` or `planner` gets the same limits.

## Updates

- **Skills, agents and the hook** update with the plugin: `claude plugin update <plugin>@team-agent-kits`.
- **Copied files** (rules, `CLAUDE.md`, settings, Git hooks, pack skills) belong to your repository and are not changed by an update. Run setup again to get fresh `.template` files beside any that differ, and merge what you want.

## Maintaining the kits

- Each plugin is a folder under `plugins/`: `agents/`, `skills/`, `hooks/hooks.json`, `scripts/` (the three hook scripts and the setup script) and `templates/` (everything setup copies, with packs under `templates/packs/`).
- Keep application-specific content out. If something only fits one application, it belongs in that repository's own rules or skills.
- After any change, run `claude plugin validate . --strict` here, and bump `version` in the plugin's `.claude-plugin/plugin.json` so users receive it.
- Shell scripts must keep LF line endings; `.gitattributes` enforces this.
