# Audit record schema

Reference for `.claude/rules/audit-logging.md`. Every audit record is a single-line JSON object (NDJSON). All events share this base schema; event-specific fields may be added, but the mandatory fields are always present. Add this application's own event-specific fields to the table.

## Mandatory fields

| Field | Meaning | When |
|---|---|---|
| `timestamp` | ISO-8601 with timezone | Always |
| `logType` | Always `AUDIT` in the audit file. Application log records carry `APPLICATION` and do not follow this schema | Always |
| `activityType` | What happened, e.g. `USER_ROLE_ASSIGNMENT` | Always |
| `eventCategory` | e.g. `AUDIT`, `SECURITY`, `ERROR` | Always |
| `outcome` | `ALLOWED`, `DENIED`, `SUCCESS` or `FAILURE` | Always |
| `description` | Short human-readable description | Always |
| `reasonCode` | Reason code or failure reason | Where applicable, otherwise `null` |
| `application` | Application or service name | Always |
| `component` | Process or component performing the action | Always |
| `environment` | Environment identifier | Always |
| `instanceId` | Application instance or pod identifier | Always |
| `correlationId` | Request correlation identifier | Always |
| `performedBy.username` | Acting user's username (from the validated token) | Always, where available |
| `performedBy.subjectId` | Acting user's subject ID (from the validated token) | Always, where available |
| `targetUser.username` | User account affected by the action | Where applicable |
| `source.hostname`, `source.ipAddress` | Source host and IP | Always |
| `source.port` | Source port | Where applicable |
| `destination.hostname`, `destination.ipAddress`, `destination.port` | Destination host, IP and port | Where applicable |
| `network.protocol` | Network protocol, e.g. `HTTPS`, `LDAPS` | Where applicable |

Never include passwords, credentials, secrets, access tokens or unnecessary personal data.

## Example record

All examples here are shown formatted for readability; in the log file each record is a single line.

```json
{
  "timestamp": "2026-09-23T14:30:22+01:00",
  "logType": "AUDIT",
  "activityType": "USER_ROLE_ASSIGNMENT",
  "eventCategory": "AUDIT",
  "outcome": "SUCCESS",
  "description": "Role assigned to user",
  "reasonCode": null,
  "application": "example-service",
  "component": "directory-gateway",
  "environment": "production",
  "instanceId": "pod-7a4d5f",
  "correlationId": "9c76d6e3-21c1-49c1-b1d5-2543fa0b9abc",
  "performedBy": { "username": "admin.user", "subjectId": "7f2c3a14" },
  "targetUser": { "username": "external.user@example.com" },
  "source": { "hostname": "api-01", "ipAddress": "10.10.1.25", "port": 51820 },
  "destination": { "hostname": "directory.internal.example", "ipAddress": "10.20.0.15", "port": 636 },
  "network": { "protocol": "LDAPS" }
}
```

## Example: one failed request in both files

A user tries to assign a role and the connection to the directory times out. The audit file gets exactly one record for the event; the application file gets the technical detail. The same `correlationId` joins them.

### Audit record (audit file)

```json
{
  "timestamp": "2026-10-08T14:30:22+01:00",
  "logType": "AUDIT",
  "activityType": "USER_ROLE_ASSIGNMENT",
  "eventCategory": "AUDIT",
  "outcome": "FAILURE",
  "description": "Role assignment failed: directory unavailable",
  "reasonCode": "DIRECTORY_CONNECTION_TIMEOUT",
  "application": "example-service",
  "component": "directory-gateway",
  "environment": "production",
  "instanceId": "pod-7a4d5f",
  "correlationId": "9c76d6e3-21c1-49c1-b1d5-2543fa0b9abc",
  "performedBy": { "username": "admin.user", "subjectId": "7f2c3a14" },
  "targetUser": { "username": "external.user@example.com" },
  "source": { "hostname": "api-01", "ipAddress": "10.10.1.25", "port": 51820 },
  "destination": { "hostname": "directory.internal.example", "ipAddress": "10.20.0.15", "port": 636 },
  "network": { "protocol": "LDAPS" }
}
```

### Application log records (application file)

Application records do not follow the audit schema. Each has the timestamp, `logType`, level, logger, message and the MDC context, plus a stack trace (escaped onto the same line) when there is one. The names `level`, `logger`, `message` and `stackTrace` are illustrative: use whatever the Logstash Logback Encoder configuration produces, and keep them consistent.

```json
{
  "timestamp": "2026-10-08T14:30:21+01:00",
  "logType": "APPLICATION",
  "level": "WARN",
  "logger": "uk.example.service.directory.DirectoryRoleGateway",
  "message": "Directory update timed out, retrying (attempt 2 of 3)",
  "correlationId": "9c76d6e3-21c1-49c1-b1d5-2543fa0b9abc",
  "username": "admin.user",
  "subjectId": "7f2c3a14",
  "environment": "production",
  "instanceId": "pod-7a4d5f",
  "requestPath": "/users/roles",
  "clientIp": "10.10.1.25"
}
```

```json
{
  "timestamp": "2026-10-08T14:30:22+01:00",
  "logType": "APPLICATION",
  "level": "ERROR",
  "logger": "uk.example.service.directory.DirectoryRoleGateway",
  "message": "Directory update failed after 3 attempts",
  "stackTrace": "java.net.SocketTimeoutException: ...",
  "correlationId": "9c76d6e3-21c1-49c1-b1d5-2543fa0b9abc",
  "username": "admin.user",
  "subjectId": "7f2c3a14",
  "environment": "production",
  "instanceId": "pod-7a4d5f",
  "requestPath": "/users/roles",
  "clientIp": "10.10.1.25"
}
```

The application messages name no target user: who was affected belongs in the audit record only.

The hostnames, addresses, IDs, package name and request path in these examples are illustrative only. Never copy them into code or configuration.
