---
paths:
  - "src/auth/**"
  - "src/services/**"
---
# Authentication and roles (Okta)

There are **two different kinds of roles**. Do not confuse them:

1. **Operator roles: `admin`, `editor` and `viewer`.** From Okta; control who may use this UI and what they may do.
2. **Provisioned user roles.** The roles the UI lets an operator assign to the users being provisioned; stored by the backend in OpenDJ.

Rules:

- Sign in through **Okta** using OIDC **Authorization Code flow with PKCE**, as a **public client with no client secret**. Use Okta's official `@okta/okta-auth-js` SDK or a standard OIDC library (choice TBC: see `docs/open-questions.md`). Never use the implicit flow or the password grant.
- Keep the access token **in memory only**. Never put tokens in `localStorage` or `sessionStorage`, and never log them.
- Attach the access token as a Bearer token in **one place** in `src/services/`, and handle token refresh and expiry there. Send the user back to sign in cleanly when the session ends.
- Keep Okta-specific code in `src/auth/` behind a **small interface** (current user, roles, login, logout, get token), so the rest of the UI does not depend on Okta directly.
- The UI may read the operator's roles from the token **only to decide what to show** (e.g. hiding an action an `editor` cannot use). This is usability, not security. The backend enforces every permission; handle `401` and `403` properly.
- **`viewer` is read-only (decided).** A viewer can see information but cannot add, edit or remove anything, including roles. Hide every add, edit and remove action from a viewer, and show a clear "you do not have permission" message if the backend returns `403`.
- What `admin` and `editor` may each do is **TBC**. Ask for the permission matrix rather than guessing.
- **Until Okta sign-in is built**, `src/auth/operator.ts` returns `editor` for everyone and the site header shows **EDITOR**. Replace it with the real role from the token when the Okta work starts; nothing else may depend on it.
- The Okta issuer URL and client ID come from configuration per environment, never from code.
