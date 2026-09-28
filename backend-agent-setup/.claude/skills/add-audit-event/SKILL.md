---
name: add-audit-event
description: Test-first procedure for emitting a structured JSON audit record in the user-provisioning backend with all mandatory fields, MDC context and correlation ID. Use this whenever you add or change any action that must be audited, including success and failure paths, provisioning steps, role changes, authorisation failures and infrastructure errors.
---

# Emit an audit event (test-first)

Relevant rules: `.claude/rules/tdd.md`, `audit-logging.md`. Full schema: `docs/reference/audit-record-schema.md`. Follow the `tdd-cycle` skill.

## 1. Choose the event
- `activityType`: a stable, upper-snake-case name (e.g. `USER_CREATION`, `ROLE_REMOVAL`, `PROVISIONING_PARTIAL_FAILURE`). Reuse an existing one if it fits.
- `eventCategory`, `outcome` (`ALLOWED`, `DENIED`, `SUCCESS`, `FAILURE`) and `reasonCode` for failures and denials.

## 2. Red: write the failing test first
- Capture the audit logger's output in the test (e.g. a list appender on the audit logger).
- Trigger the action on **each path** (success and every failure) and assert:
  - exactly one record per event, parseable as single-line JSON;
  - all mandatory fields present with correct values;
  - operator identity matches the mock JWT; correlation ID matches `X-Correlation-ID` when supplied, and is generated otherwise;
  - no secrets, tokens or unnecessary personal data in the record.
- Run it, confirm it fails because the record is missing or wrong, record the red evidence, and commit.

## 3. Green: emit the record
- Emit through the single audit component in `audit/` (create it in the first sprint that needs it, test-first). Never log audit events ad hoc with `log.info` in business code, and never write files directly.
- Contextual fields come from MDC automatically: `correlationId`, `username`, `subjectId`, `environment`, `instanceId`, `requestPath`, `clientIp`. Do not pass them by hand.
- Supply the event-specific fields: target user, component, destination host/port/protocol for outbound calls (LDAP, Oracle, S3).
- Emit on success **and** failure (including exceptions caught and rethrown); for multi-step flows, one record per step plus the overall outcome.
- Outside a request (e.g. the S3 scheduled job), populate MDC with a generated correlation ID and clear it afterwards.

Run until green. Commit.

## 4. Refactor
Tidy with tests green.
