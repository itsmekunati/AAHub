---
paths:
  - "src/main/java/**/security/**"
  - "src/main/java/**/api/**"
  - "src/main/java/**/config/**"
---
# Authentication and authorisation (Okta)

There are **two different kinds of roles**. Do not confuse them:

1. **Operator roles: `editor` and `viewer` (decided; there is no `admin`).** These come from Okta and control who may use this application.
2. **Provisioned user roles.** The roles this application assigns to the users it manages, stored in OpenDJ.

Rules for operator authentication:

- Administrators sign in through **Okta**. The UI sends the access token as a Bearer token. This API validates it as an **OAuth2 resource server** (Spring Security, JWT validation against the Okta issuer). This API never sees passwords and never issues tokens.
- Use Spring Security's standard resource server support. Do not add the Okta Spring Boot starter without asking; it is not needed to validate tokens.
- The Okta issuer URI, client ID and any audience settings come from configuration per environment.
- Map Okta roles to Spring authorities (`ROLE_EDITOR`, `ROLE_VIEWER`) in **one dedicated converter class**. Which claim carries the roles (for example a `groups` claim or a custom claim from the Okta authorization server) is TBC, so make the claim path configurable.
- **Deny by default.** Every endpoint requires authentication, and each declares which role(s) may call it (e.g. `@PreAuthorize`). A new endpoint must never be accidentally public.
- **Permission matrix (decided):**
  - **`editor`** may call every endpoint: User Provisioning, User Role Management and Check existing access.
  - **`viewer`** may call the **User Role Management** endpoints (looking up a user's LDAP groups, the group catalogue, and submitting role change requests) and the **Check existing access** endpoints, but **no User Provisioning endpoint** (user look-up for provisioning, locations, the existing-user check, provisioning requests). Every User Provisioning request from a viewer returns `403` and is audited.
  - Declare the allowed roles on every endpoint (`@PreAuthorize("hasRole('EDITOR')")` for provisioning, `hasAnyRole('EDITOR', 'VIEWER')` for the rest). An operator with neither role gets `403` everywhere.
- An operator must never be able to grant a provisioned user more access than their own role allows (no privilege escalation).
- Take the acting operator's identity only from the validated token, never from the request body or a client-settable header.
- Return `401` for missing or invalid tokens and `403` for authenticated users without the required role.
- Do not enable permissive CORS (`*`). Allowed origins are set per environment in configuration.

## Authentication auditing

Authentication itself is managed by Okta. Successful and failed authentication, account lockouts, password resets and authentication anomaly detection are sourced from **the Okta System Log** and are **not duplicated** by this application.

This application logs only:

- Token validation failures
- Missing or invalid tokens (`401`)
- Access denied events (`403`)
- Authorisation failures
- Administrative actions performed through the application

These records must include username (where available), subject identifier, source IP address, timestamp, outcome, and failure reason where applicable, plus a correlation identifier that can be matched with the Okta System Log where possible.
