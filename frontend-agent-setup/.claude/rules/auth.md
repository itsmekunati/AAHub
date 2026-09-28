---
paths:
  - "src/auth/**"
  - "src/services/**"
---
# Authentication and roles (Keycloak)

There are **two different kinds of roles**. Do not confuse them:

1. **Operator roles: `admin` and `editor`.** From Keycloak; control who may use this UI and what they may do.
2. **Provisioned user roles.** The roles the UI lets an operator assign to the users being provisioned; stored by the backend in ApacheDS.

Rules:

- Sign in through **Keycloak** using OIDC **Authorization Code flow with PKCE**, as a **public client with no client secret**. Use the official `keycloak-js` adapter or a standard OIDC library (choice TBC: see `docs/open-questions.md`). Never use the implicit flow or the password grant.
- Keep the access token **in memory only**. Never put tokens in `localStorage` or `sessionStorage`, and never log them.
- Attach the access token as a Bearer token in **one place** in `src/services/`, and handle token refresh and expiry there. Send the user back to sign in cleanly when the session ends.
- Keep Keycloak-specific code in `src/auth/` behind a **small interface** (current user, roles, login, logout, get token), so the rest of the UI does not depend on Keycloak directly.
- The UI may read the operator's roles from the token **only to decide what to show** (e.g. hiding an action an `editor` cannot use). This is usability, not security. The backend enforces every permission; handle `401` and `403` properly.
- What `admin` and `editor` may each do is **TBC**. Ask for the permission matrix rather than guessing.
- Keycloak URL, realm and client ID come from configuration per environment, never from code.
