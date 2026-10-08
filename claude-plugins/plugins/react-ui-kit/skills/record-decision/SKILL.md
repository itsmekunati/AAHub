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
- Write it as a rule, not a history: "A read-only role cannot delete; hide the delete action for it".
- A value that differs by environment (issuer URL, client ID, test domains) becomes "comes from configuration key `x`". Never put the value itself in a rule, skill or doc.

## 3. Update everything that waited on it
- Grep `.claude/rules/`, `.claude/skills/`, `CLAUDE.md` and `docs/` for `open-questions` and `#<n>`.
- Rewrite each "stop and ask", `NEEDS-DECISION` or "if not decided" step so it follows the decision, and remove the reference.
- Skills and agents that come from the plugin are not in this repository and cannot be changed here. They tell the agent to check `docs/open-questions.md` and the rule files, so the rule you wrote in step 2 is what they follow.
- If mocks, personas or test data were built around a placeholder (for example an identifier format in `src/mocks/`), list them as follow-up work; do not change code in this commit.

## 4. Remove the row
Delete the row from `docs/open-questions.md`. Do not renumber the other rows: other files refer to them by number.

## 5. The other repository
Many questions exist in both the UI and API repositories (permission matrix, sign-in, hooks, Snyk, how the UI is served). Name the matching question in the backend's `docs/open-questions.md` if you know it, and remind the user to record the decision there too.

## 6. Commit
Use the `react-ui-kit:commit` skill with the message `docs(rules): record decision on <topic>`.

## 7. Report
The decision as recorded, every file changed, follow-up code changes needed, and the matching question in the other repository.
