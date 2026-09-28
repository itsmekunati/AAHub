---
paths:
  - "src/main/java/**/security/**"
  - "src/main/java/**/api/**"
  - "src/main/java/**/config/**"
---
# Authentication and authorisation (Keycloak)

There are **two different kinds of roles**. Do not confuse them:

1. **Operator roles: `admin` and `editor`.** These come from Keycloak and control who may use this application.
2. **Provisioned user roles.** The roles this application assigns to the users it manages, stored in ApacheDS.

Rules for operator authentication:

- Administrators sign in through **Keycloak**. The UI sends the access token as a Bearer token. This API validates it as an **OAuth2 resource server** (Spring Security, JWT validation against the Keycloak issuer). This API never sees passwords and never issues tokens.
- Do **not** use the legacy Keycloak Spring Boot adapters (deprecated). Use Spring Security's resource server support.
- The Keycloak issuer URI, client ID and any audience settings come from configuration per environment.
- Map Keycloak roles to Spring authorities (`ROLE_ADMIN`, `ROLE_EDITOR`) in **one dedicated converter class**. Where the roles sit in the token (realm or client roles) is TBC, so make the claim path configurable.
- **Deny by default.** Every endpoint requires authentication, and each declares which role(s) may call it (e.g. `@PreAuthorize`). A new endpoint must never be accidentally public.
- What `admin` and `editor` may each do is **TBC**. Ask for the permission matrix rather than guessing. An operator must never be able to grant a provisioned user more access than their own role allows (no privilege escalation).
- Take the acting operator's identity only from the validated token, never from the request body or a client-settable header.
- Return `401` for missing or invalid tokens and `403` for authenticated users without the required role.
- Do not enable permissive CORS (`*`). Allowed origins are set per environment in configuration.

## Authentication auditing

Authentication itself is managed by Keycloak. Successful and failed authentication, account lockouts, password resets and authentication anomaly detection are sourced from **Keycloak audit logs** and are **not duplicated** by this application.

This application logs only:

- Token validation failures
- Missing or invalid tokens (`401`)
- Access denied events (`403`)
- Authorisation failures
- Administrative actions performed through the application

These records must include username (where available), subject identifier, source IP address, timestamp, outcome, and failure reason where applicable, plus a correlation identifier that can be matched with Keycloak audit logs where possible.
