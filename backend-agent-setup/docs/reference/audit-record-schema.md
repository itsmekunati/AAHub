# Audit record schema

Reference for `.claude/rules/audit-logging.md`. Every audit record is a single-line JSON object (NDJSON). All events share this base schema; event-specific fields may be added, but the mandatory fields are always present.

## Mandatory fields

| Field | Meaning | When |
|---|---|---|
| `timestamp` | ISO-8601 with timezone | Always |
| `activityType` | What happened, e.g. `USER_ROLE_ASSIGNMENT` | Always |
| `eventCategory` | e.g. `AUDIT`, `SECURITY`, `ERROR`, or `UI` for an event reported by the UI | Always |
| `outcome` | `ALLOWED`, `DENIED`, `SUCCESS` or `FAILURE` | Always |
| `description` | Short human-readable description | Always |
| `reasonCode` | Reason code or failure reason | Where applicable, otherwise `null` |
| `application` | Application or service name | Always |
| `component` | Process or component performing the action | Always |
| `environment` | Environment identifier | Always |
| `instanceId` | Application instance or pod identifier | Always |
| `correlationId` | Request correlation identifier | Always |
| `transactionId` | Unique ID this API generates for the transaction. Never the ticket | Every transaction (create, change, remove) |
| `ticketId` | The mandatory JSM/Jira ticket supplied with the transaction | Every transaction (create, change, remove) |
| `performedBy.username` | Acting operator's username (from the validated token) | Always, where available |
| `performedBy.subjectId` | Acting operator's subject ID (from the validated token) | Always, where available |
| `targetUser.username` | User account affected by the action | Where applicable |
| `targetUser.userType` | User type chosen by the operator: `government`, `forestry` or `nature` | User Provisioning events |
| `targetUser.classification` | `INTERNAL` or `EXTERNAL`, decided from the email domain | User Role Management events |
| `source.hostname`, `source.ipAddress` | Source host and IP | Always |
| `source.port` | Source port | Where applicable |
| `destination.hostname`, `destination.ipAddress`, `destination.port` | Destination host, IP and port | Where applicable |
| `network.protocol` | Network protocol, e.g. `HTTPS`, `LDAPS` | Where applicable |
| `ui.journey`, `ui.step`, `ui.fields` | The journey, the step and the names of the fields involved, as reported by the UI | `UI` events |

Never include passwords, credentials, secrets, access tokens or unnecessary personal data.

## Example record

Shown formatted for readability; in the log file it is a single line.

```json
{
  "timestamp": "2026-09-23T14:30:22+01:00",
  "activityType": "USER_ROLE_ASSIGNMENT",
  "eventCategory": "AUDIT",
  "outcome": "SUCCESS",
  "description": "Role assigned to user",
  "reasonCode": null,
  "application": "user-provisioning-service",
  "component": "ldap-service",
  "environment": "production",
  "instanceId": "pod-7a4d5f",
  "correlationId": "9c76d6e3-21c1-49c1-b1d5-2543fa0b9abc",
  "transactionId": "example-transaction-id",
  "ticketId": "example-ticket-id",
  "performedBy": { "username": "admin.user", "subjectId": "7f2c3a14" },
  "targetUser": { "username": "external.user@example.com" },
  "source": { "hostname": "rps-api-01", "ipAddress": "10.10.1.25", "port": 51820 },
  "destination": { "hostname": "ldap.internal.local", "ipAddress": "10.20.0.15", "port": 636 },
  "network": { "protocol": "LDAPS" }
}
```

The hostnames, addresses and IDs above are illustrative only. Never copy them into code or configuration.
