---
paths:
  - "src/main/java/**/security/**"
  - "src/main/java/**/api/**"
  - "src/main/java/**/config/**"
---
# Authentication and authorisation (Okta)

<!-- SETUP: list the roles this application uses and what each may do. Until the permission matrix is agreed, keep it in docs/open-questions.md. -->
**Roles** come from Okta and control who may use this application and what they may do. If the application also manages roles for other people, those are a different thing: never confuse the two.

- Users sign in through **Okta**. The UI sends the access token as a Bearer token. This API validates it as an **OAuth2 resource server** (Spring Security, JWT validation against the Okta issuer). This API never sees passwords and never issues tokens.
- Use Spring Security's standard resource server support. Do not add the Okta Spring Boot starter without asking; it is not needed to validate tokens.
- The Okta issuer URI, client ID and any audience settings come from configuration per environment.
- Map Okta roles to Spring authorities (for example `ROLE_ADMIN`, `ROLE_EDITOR`, `ROLE_VIEWER`) in **one dedicated converter class**. Make the claim path that carries the roles (for example a `groups` claim or a custom claim) configurable.
- **Deny by default.** Every endpoint requires authentication, and each declares which role(s) may call it (e.g. `@PreAuthorize`). A new endpoint must never be accidentally public.
- **A read-only role is read-only.** It may call read (`GET`) endpoints only: every create, change or delete returns `403`. No write endpoint may list it among its allowed roles.
- If what a role may do is not written down, ask for the permission matrix rather than guessing. A user must never be able to grant more access than their own role allows (no privilege escalation).
- Take the caller's identity only from the validated token, never from the request body or a client-settable header.
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
