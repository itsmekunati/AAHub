---
name: provisioning-flow
description: Test-first procedure for any operation that writes to both ApacheDS (roles) and Oracle (user details/provisioning records), including failing tests for every failure path first, ordering, compensation, failed-state recording and auditing each step. Use this whenever a change creates, updates, enables, disables or deletes a provisioned user, or assigns or removes their roles.
---

# Provisioning flow across ApacheDS and Oracle (test-first)

Relevant rules: `.claude/rules/tdd.md`, `provisioning.md`, `user-classification.md`, `audit-logging.md`, `ldap.md`, `oracle-jpa.md`. Follow the `tdd-cycle` skill for each acceptance criterion.

ApacheDS and Oracle **cannot share a transaction**. Every multi-system operation is an explicit, ordered, audited flow.

## 1. Confirm the order and failure strategy
- Which system is written first is open (`docs/open-questions.md` #9). If the sprint contract does not state it, **stop and ask**.
- Confirm the failure strategy from the contract: **compensate** (undo the first write) or **record a failed state** (e.g. `PARTIALLY_PROVISIONED`, retryable).

## 2. Red: write the failing tests first
Using mocks for the LDAP and Oracle gateways at unit level (and containerised ApacheDS/Oracle at integration level), write tests for:
- **Happy path:** both writes happen in the agreed order; overall `SUCCESS` audited.
- **Invalid input (create flows):** invalid or missing email, or a missing or unknown `userType` → validation error before any write.
- **First write fails:** nothing is written to the second system; the failure is audited.
- **Second write fails:** compensation or failed state occurs; each step is audited; the response is correct.
- **Compensation fails** (where compensation is used): a failed state is recorded and audited.
- **Audit content:** records carry the operator identity from the JWT, the correlation ID and all mandatory fields.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: implement the flow
Keep each step a separate method on the orchestrating service in `service/`, so the order is easy to change:
1. Validate the operator-chosen `userType` (provisioning is for internal users only; internal/external classification is not used here).
2. Audit the **request** with the target user, email and `userType`.
3. Perform the first write and audit its outcome.
4. Perform the second write and audit its outcome.
5. On success, mark the provisioning record complete and audit the overall `SUCCESS`.
6. On failure of the second write, compensate or record the failed state as agreed, and audit it. Never leave the systems inconsistent without a record.

Run until green, then the whole unit and slice suite. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. Refactor and integrate
Tidy with tests green. Run the integration tests against containerised ApacheDS/Oracle. Never use real systems.
