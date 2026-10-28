---
name: record-decision
description: Procedure for recording the answer to an open question - write it into the rule file the question names, update every project skill and rule step that waited on it, delete the row from docs/open-questions.md and commit. Use this whenever someone says an open question has been decided or answered.
argument-hint: "<question number> <the decision>"
---

# Record a decision on an open question

Every file this changes is on the "ask first" list, so each edit needs the user's approval. Work on a branch, not `main`.

## 1. Find the question
- Open `docs/open-questions.md` and find the row. The last column names where the answer goes.
- If the decision does not fully answer the question, record the part that is decided and leave the rest of the row, reworded.

## 2. Write the rule
- Add the decision to the named rule file in `.claude/rules/` (or the "Commands" section of `CLAUDE.md` for tooling), replacing any "TBC", "still open" or "see `docs/open-questions.md`" line.
- Write it as a rule, not a history: "The database is written first; if the second system fails, remove the row again (compensate)".
- A value that differs by environment (hostnames, bucket names, account ids, API base URL) becomes "comes from configuration key `x`". Never put the value itself in a rule, skill or doc.
- If the decision affects both halves (for example the error response shape, or how the UI is served), update the `backend-` and `frontend-` rule files it touches.

## 3. Update everything that waited on it
- Grep `.claude/rules/`, `.claude/skills/`, `CLAUDE.md` and `docs/` for `open-questions` and `#<n>`.
- Rewrite each "stop and ask", `NEEDS-DECISION` or "if not decided" step so it follows the decision, and remove the reference.
- Skills and agents that come from the plugin are not in this repository and cannot be changed here. They tell the agent to check `docs/open-questions.md` and the rule files, so the rule you wrote in step 2 is what they follow.
- If code, mocks or test data were built around a placeholder (for example an identifier format in `av-ui/src/mocks/`), list them as follow-up work; do not change code in this commit.

## 4. Remove the row
Delete the row from `docs/open-questions.md`. Do not renumber the other rows: other files refer to them by number.

## 5. Commit
Use the `angularjs-micronaut-kit:commit` skill with the message `docs(rules): record decision on <topic>`.

## 6. Report
The decision as recorded, every file changed, and follow-up code changes needed in each half.
