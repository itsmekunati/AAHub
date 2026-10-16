---
paths:
  - "src/auth/**"
  - "src/services/**"
---
# Authentication and roles (Okta)

There are **two different kinds of roles**. Do not confuse them:

1. **Operator roles: `editor` and `viewer` (decided; there is no `admin`).** From Okta; control who may use this UI and what they may do.
2. **Provisioned user roles.** The roles the UI lets an operator assign to the users being provisioned; stored by the backend in OpenDJ.

Rules:

- Operators sign in with **Okta SSO with MFA (decided)** on the **Okta-hosted sign-in page**, using OIDC **Authorization Code flow with PKCE** as a **public client with no client secret** (redirect only). Use Okta's official `@okta/okta-auth-js` SDK or a standard OIDC library (choice TBC: see `docs/open-questions.md`). Never use the implicit flow or the password grant, never embed the Okta Sign-In Widget, and never collect passwords or MFA codes in this app.
- **Okta enforces MFA** through the app's sign-on policy. The UI never builds MFA screens and never decides anything from `amr` or `acr` claims; if MFA must be proven, the backend checks it when it validates the token.
- **SSO needs no special handling:** an operator with an existing Okta session simply comes back signed in. The session can end at any time (MFA policies often mean shorter sessions), so always handle it by sending the operator back to sign in.
- Keep the access token **in memory only**. Never put tokens in `localStorage` or `sessionStorage`, and never log them.
- Attach the access token as a Bearer token in **one place** in `src/services/`, and handle token refresh and expiry there. Send the user back to sign in cleanly when the session ends.
- Keep Okta-specific code in `src/auth/` behind a **small interface** (current user, roles, login, logout, get token), so the rest of the UI does not depend on Okta directly.
- The UI may read the operator's roles from the token **only to decide what to show** (e.g. hiding provisioning from a `viewer`). This is usability, not security. The backend enforces every permission; handle `401` and `403` properly.
- **Okta groups (decided, the same in every environment):** `AAH_Editor` is the `editor` role and `AAH_Viewer` is the `viewer` role, matched exactly.
  - An operator in both groups is an `editor`.
  - An operator in neither group sees a "You do not have access to this service" page with a sign-out link, and nothing else.
  - Map the groups to roles in **one place** in `src/auth/` (beside `permissions.ts`), with the group names as constants there. They do not differ by environment, so they are not in `config.json`. Which claim carries the groups is still open (`docs/open-questions.md` #1).
- **Permission matrix (decided):**
  - **`editor`** can use every part of the service: User provisioning, User Role Manager and Check existing access to RP&S.
  - **`viewer`** can use **User Role Manager** (the whole journey, including changing a user's groups and submitting) and **Check existing access to RP&S**, but **not User provisioning**. Hide the provisioning tab and home page task from a viewer, and show the "You do not have permission to use this part of the service" page (`src/pages/NoPermissionPage.tsx`) if a viewer opens any provisioning address directly.
  - The rules live in **one place**, `src/auth/permissions.ts` (e.g. `canProvision(role)`). Pages ask it; they never compare role names themselves.
  - Show a clear "you do not have permission" message whenever the backend returns `403`.
- The site header shows the operator's role (**EDITOR** or **VIEWER**), read with `useOperatorRole()` from `src/auth/OperatorRoleContext.tsx`. Tests set the role with `renderApp({ role })`.
- **Until Okta sign-in is built**, `src/auth/operator.ts` returns `editor` for everyone. When the Okta work starts, the role comes from the token through the same context; nothing else may depend on `operator.ts`.
- The Okta issuer URL and client ID come from configuration per environment, never from code.
