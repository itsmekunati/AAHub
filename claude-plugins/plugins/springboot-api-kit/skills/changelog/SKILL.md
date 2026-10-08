---
name: changelog
description: Draft release notes for the API from the commits since the last tag, grouped for readers rather than by commit, with breaking API changes marked, and add them to CHANGELOG.md if the user agrees. Use this when the user asks for release notes or a changelog.
argument-hint: "[from ref, default the latest tag]"
disable-model-invocation: true
---

# Release notes (backend)

## 1. Pick the range
- From: the argument, otherwise the latest tag (`git describe --tags --abbrev=0`), otherwise the first commit. Say which one you used.
- `git log --no-merges --format='%h %s%n%b' <from>..HEAD`.

## 2. Group for readers
Group by what changed for the UI team and the people running the service, not by commit:
- **New:** endpoints and features.
- **Changed:** behaviour, validation or responses.
- **Fixed:** bugs.
- **API changes:** from the `springboot-api-kit:api-contract-diff` skill against `<from>`; mark each **breaking** change and what the UI must do.
- **Audit:** new or changed audit events.
- **Security:** roles, authentication, anything tightened.
- **Operations:** new migrations, new configuration keys or Secrets each environment must set (names only, never values), health or logging changes.

Leave out `test(...)`, `refactor(...)`, `chore` and `docs(rules)` commits unless they change behaviour. Each AC's `test(...)` and `feat(...)` commits become one line per feature.

## 3. Write
- Plain English, one line per item, past tense ("Added ...", "Fixed ...").
- No personal data, ticket contents, hostnames or environment names.
- Heading: `## <version or "Unreleased"> - <date>`. Ask for the version if the user has one.

## 4. Save only if asked
Print the draft. Add it to the top of `CHANGELOG.md` (create it if missing) only if the user agrees, then offer the `springboot-api-kit:commit` skill.
