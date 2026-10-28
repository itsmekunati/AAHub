---
name: changelog
description: Draft release notes for the application (AngularJS UI and Micronaut API) from the commits since the last tag, grouped for readers rather than by commit, and add them to CHANGELOG.md if the user agrees. Use this when the user asks for release notes or a changelog.
argument-hint: "[from ref, default the latest tag]"
disable-model-invocation: true
---

# Release notes

## 1. Pick the range
- From: the argument, otherwise the latest tag (`git describe --tags --abbrev=0`), otherwise the first commit. Say which one you used.
- `git log --no-merges --format='%h %s%n%b' <from>..HEAD`.

## 2. Group for readers
Group by what changed for the people using or running the service, not by commit or by half:
- **New:** pages, journeys, endpoints and features.
- **Changed:** behaviour, wording, layout, validation or responses users or integrators will notice.
- **Fixed:** bugs users could hit.
- **Accessibility:** improvements and fixes (focus, labels, error summary, reflow).
- **Security:** anything tightened, anything removed from the bundle.
- **Operations:** new migrations, new configuration keys (backend `application.yml` or the frontend runtime configuration) or Secrets each environment must set (names only, never values), health check changes.

Leave out `test(...)`, `refactor(...)`, `chore` and `docs(rules)` commits unless they change behaviour. Each AC's `test(...)` and `feat(...)` commits become one line per feature.

## 3. Write
- Plain English, sentence case, one line per item, past tense ("Added ...", "Fixed ...").
- No personal data, ticket contents, hostnames or environment names.
- Heading: `## <version or "Unreleased"> - <date>`. Ask for the version if the user has one.

## 4. Save only if asked
Print the draft. Add it to the top of `CHANGELOG.md` (create it if missing) only if the user agrees, then offer the `angularjs-micronaut-kit:commit` skill.
