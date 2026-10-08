---
paths:
  - "src/auth/**"
  - "src/services/**"
---
# Authentication and roles (Okta)

<!-- SETUP: list the roles this application uses and what each may see. Until the permission matrix is agreed, keep it in docs/open-questions.md. -->

**Roles** come from Okta and control who may use this UI and what they may do. If the application also manages roles for other people, those are a different thing: never confuse the two.

Rules:

- Sign in through **Okta** using OIDC **Authorization Code flow with PKCE**, as a **public client with no client secret**. Use Okta's official `@okta/okta-auth-js` SDK or a standard OIDC library (if the choice is not written here, it is an open question in `docs/open-questions.md`). Never use the implicit flow or the password grant.
- Keep the access token **in memory only**. Never put tokens in `localStorage` or `sessionStorage`, and never log them.
- Attach the access token as a Bearer token in **one place** in `src/services/`, and handle token refresh and expiry there. Send the user back to sign in cleanly when the session ends.
- Keep Okta-specific code in `src/auth/` behind a **small interface** (current user, roles, login, logout, get token), so the rest of the UI does not depend on Okta directly.
- The UI may read the user's roles from the token **only to decide what to show** (e.g. hiding an action a role cannot use). This is usability, not security. The backend enforces every permission; handle `401` and `403` properly.
- **A read-only role is read-only.** It can see information but cannot add, edit or remove anything. Hide every add, edit and remove action from it, and show a clear "you do not have permission" message if the backend returns `403`.
- If what a role may do is not written down, ask for the permission matrix rather than guessing.
- The Okta issuer URL and client ID come from configuration per environment, never from code.
