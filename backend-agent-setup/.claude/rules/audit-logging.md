---
paths:
  - "src/main/java/**"
  - "src/main/resources/logback*.xml"
  - "src/main/resources/application*.yml"
---
# Audit logging and security monitoring

Audit logs must provide enough detail to support security investigations, incident response, compliance reporting and operational troubleshooting. Audit records are generated for **both successful and unsuccessful** activities, as structured JSON.

## Auditable events

At minimum, generate audit records for:

- Authentication-related events this application owns (see `.claude/rules/security-okta.md`: token validation failures, `401`, `403`, authorisation failures)
- Privileged user activity, including elevated administrative operations
- User account lifecycle changes: creation, deletion, enablement, disablement, role assignment, role removal, permission changes
- Changes to security-related configuration
- Detection of anomalous or suspicious activity
- System and service connections
- Application errors, failures and exceptions
- User provisioning requests, and outcomes: success, failure, partial failure
- LDAP operations affecting user roles
- Administrative actions performed through the application

Account lockouts and password resets are exposed by Okta and are not duplicated here.

## Error and failure events

Also generate audit records for: application exceptions; LDAP, Futures Database and AWS S3 connectivity failures; authentication and authorisation failures; configuration validation failures; scheduled job failures; unexpected application errors. Include enough to troubleshoot, but never passwords, credentials, secrets, access tokens or sensitive personal information.

## Anomalous activity

Generate audit events for suspicious behaviour, including repeated failed authentication attempts, repeated authorisation failures, unusual administrative activity, excessive provisioning operations, unexpected configuration modifications, and access attempts from unauthorised users. **Detection thresholds are configurable and environment specific.**

## Events reported by the UI

The UI reports things this API cannot see for itself (a journey started or cancelled, a client-side check that stopped the operator, a failure shown on screen) to `POST /audit-events`. Write each one to the same audit log, in the base schema.

- Mark them as client-reported: `eventCategory` is `UI` and `component` is `ui`. They are supplementary and best-effort; never treat one as proof that something did or did not happen.
- Accept only the event types on a fixed allow-list (`JOURNEY_STARTED`, `JOURNEY_CANCELLED`, `VALIDATION_BLOCKED`, `SCREEN_ERROR`) and only the expected fields (`eventType`, `journey`, `step`, `reasonCode`, `fields`, `userType`, `transactionId`). Anything else is a `400`. Drop unexpected fields; never log the raw body.
- Take the operator identity, timestamp, source IP and correlation ID from the request and the validated token, never from the body.
- The endpoint requires authentication and is open to `admin`, `editor` and `viewer`. It is not a transaction: no JSM/Jira ticket is required and no transaction ID is generated.
- Limit the body size, strip line breaks so the record stays on one line, and rate-limit per operator so the log cannot be flooded.
- UI events must not carry personal data. Reject or drop it if it arrives.

## Implementation standards

- Use **SLF4J** for the logging API, **Logback** (Spring Boot's native integration) as the framework, **Logstash Logback Encoder** for JSON, and **MDC** for correlation and contextual fields. Prefer these over custom logging implementations.
- Audit logs and application logs go to **two separate files**, one per log type, and both follow the same rotation, shipping and retention policies (see `.claude/rules/log-shipping.md`).
- Both are **single-line JSON records** (JSON Lines / NDJSON). One event produces exactly one record. Records never span multiple lines and are machine-parseable without transformation, suitable for SIEM and log aggregation.
- Every record carries `logType`: `AUDIT` in the audit file, `APPLICATION` in the application file. Set it in the Logback configuration for each appender, never in business code.
- All audit events share **one base schema**. Event-specific fields may be added, but the mandatory fields must always be present.
- Audit log writes are thread-safe and reliable. Audit logs are not written to a database.
- Do not duplicate authentication auditing that already exists in Okta.

## Audit log and application log

- **The audit file** holds audit records only. A dedicated audit logger writes to it and does not pass its records on to the application file. Every record in it meets the mandatory fields below.
- **The application file** holds everything else: diagnostic output for developers and support (start-up, retries, debug detail, stack traces). Each record has the timestamp, level, logger, message and the MDC context, not the audit schema.
- An auditable event is always an audit record. Never rely on an application log line to show that something happened; a failure may also be logged to the application file with its stack trace, joined to the audit record by `correlationId`.
- The same limits apply to both: no passwords, credentials, secrets, access tokens or unnecessary personal data.

For an example of one failed request in both files, read `docs/reference/audit-record-schema.md`.

## Mandatory fields

Every audit record includes: activity type; event category; outcome (Allowed, Denied, Success, Failure); description; reason code or failure reason where applicable; ISO-8601 timestamp with timezone; application/service name; process or component; correlation identifier; transaction ID and JSM/Jira ticket for every transaction (see `.claude/rules/transactions.md`); operator username; operator identifier (subject ID from the validated token); source hostname and IP; destination hostname, IP, source port, destination port and network protocol where applicable; affected user account; environment identifier; application instance or pod identifier.

For the full schema and an example record, read `docs/reference/audit-record-schema.md`.

## Logging context (MDC)

Populate, where available: `correlationId`, `username`, `subjectId`, `environment`, `instanceId`, `requestPath`, `clientIp`. These must appear automatically in all audit and application log entries.

## Correlation identifiers

Every request has a correlation identifier:

- Accept an incoming `X-Correlation-ID` header when supplied; generate a UUID otherwise.
- Store it in MDC and include it in every audit record.
- Propagate it through LDAP, database and provisioning operations where possible.

For the step-by-step procedure, use the `add-audit-event` skill.
