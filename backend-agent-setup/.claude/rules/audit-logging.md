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

- Authentication-related events this application owns (see `.claude/rules/security-keycloak.md`: token validation failures, `401`, `403`, authorisation failures)
- Privileged user activity, including elevated administrative operations
- User account lifecycle changes: creation, deletion, enablement, disablement, role assignment, role removal, permission changes
- Changes to security-related configuration
- Detection of anomalous or suspicious activity
- System and service connections
- Application errors, failures and exceptions
- User provisioning requests, and outcomes: success, failure, partial failure
- LDAP operations affecting user roles
- Administrative actions performed through the application

Account lockouts and password resets are exposed by Keycloak and are not duplicated here.

## Error and failure events

Also generate audit records for: application exceptions; LDAP, Oracle and AWS S3 connectivity failures; authentication and authorisation failures; configuration validation failures; scheduled job failures; unexpected application errors. Include enough to troubleshoot, but never passwords, credentials, secrets, access tokens or sensitive personal information.

## Anomalous activity

Generate audit events for suspicious behaviour, including repeated failed authentication attempts, repeated authorisation failures, unusual administrative activity, excessive provisioning operations, unexpected configuration modifications, and access attempts from unauthorised users. **Detection thresholds are configurable and environment specific.**

## Implementation standards

- Use **SLF4J** for the logging API, **Logback** (Spring Boot's native integration) as the framework, **Logstash Logback Encoder** for JSON, and **MDC** for correlation and contextual fields. Prefer these over custom logging implementations.
- Audit logs and application logs go to the **same log file** and follow the same rotation, shipping and retention policies (see `.claude/rules/log-shipping.md`).
- Logs are **single-line JSON records** (JSON Lines / NDJSON). One event produces exactly one record. Records never span multiple lines and are machine-parseable without transformation, suitable for SIEM and log aggregation.
- All events share **one base schema**. Event-specific fields may be added, but the mandatory fields must always be present.
- Audit log writes are thread-safe and reliable. Audit logs are not written to a database.
- Do not duplicate authentication auditing that already exists in Keycloak.

## Mandatory fields

Every record includes: activity type; event category; outcome (Allowed, Denied, Success, Failure); description; reason code or failure reason where applicable; ISO-8601 timestamp with timezone; application/service name; process or component; correlation identifier; operator username; operator identifier (subject ID from the validated token); source hostname and IP; destination hostname, IP, source port, destination port and network protocol where applicable; affected user account; environment identifier; application instance or pod identifier.

For the full schema and an example record, read `docs/reference/audit-record-schema.md`.

## Logging context (MDC)

Populate, where available: `correlationId`, `username`, `subjectId`, `environment`, `instanceId`, `requestPath`, `clientIp`. These must appear automatically in all audit and application log entries.

## Correlation identifiers

Every request has a correlation identifier:

- Accept an incoming `X-Correlation-ID` header when supplied; generate a UUID otherwise.
- Store it in MDC and include it in every audit record.
- Propagate it through LDAP, database and provisioning operations where possible.

For the step-by-step procedure, use the `add-audit-event` skill.
