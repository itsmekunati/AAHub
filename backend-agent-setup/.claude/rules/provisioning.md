---
paths:
  - "src/main/java/**/service/**"
  - "src/main/java/**/ldap/**"
  - "src/main/java/**/futures/**"
---
# Provisioning across OpenDJ and Futures Database

- **Data ownership:** roles live in OpenDJ; user details and provisioning records live in the Futures Database. Do not duplicate one system's data into the other unless explicitly required. Never treat the audit log as a source of truth for user state; it shows who did what, and is not queried or reconciled against by the application.
- **OpenDJ (roles) and Futures Database (provisioning) writes cannot share one transaction.** Do not assume atomicity.
- Write provisioning as an **explicit ordered flow** with compensation/rollback, or a recorded failed state, if the second write fails.
- Every step's outcome (success, failure, partial failure) must be written to the audit log, with the acting operator's identity from the validated token.
- Which system is written first is still open: see `docs/open-questions.md`. Keep the order easy to change.
- Orchestration lives in `service/`; `ldap/` and `futures/` only talk to their own system.

For the step-by-step procedure, use the `provisioning-flow` skill.
