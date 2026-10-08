---
name: auth-integration
description: Test-first procedure for building or changing the Okta sign-in integration in src/auth/ and the token handling in src/services/ - Authorization Code flow with PKCE as a public client, token kept in memory, refresh before expiry, a single place that attaches the Bearer token, clean sign-out and session-end handling, and role checks for visibility only. Use this whenever you touch sign-in, sign-out, tokens, session expiry, the auth provider or role-based visibility.
---

# Okta sign-in integration (test-first)

Relevant rules: `.claude/rules/auth.md`, `tdd.md`, `api-client.md`, `code-style.md`. Use the `react-ui-kit:tdd-cycle` loop and the `react-ui-kit:test-infrastructure` skill (mock auth, mock API, `renderPage`).

## 1. Check the open decisions
- The OIDC library (`@okta/okta-auth-js` or a standard OIDC client), which claim carries the roles, and the Okta issuer URL and client ID per environment: check `.claude/rules/auth.md` and `docs/open-questions.md`. If the library is not decided, **stop and return `NEEDS-DECISION`**.
- The permission matrix decides which roles see what. Until it is agreed, keep role checks behind named capabilities (e.g. `canDeleteOrder(user)`) in one module, so the rules change in one place.

## 2. Shape
- `src/auth/AuthClient.ts`: the interface (created by `react-ui-kit:test-infrastructure` if missing).
- `src/auth/oktaAuth.ts`: the real implementation. It is the only file that imports the OIDC library.
- A thin **adapter** around the library, so tests can replace the library without a real Okta.
- `src/auth/AuthProvider.tsx`: provides the `AuthClient` to React; pages use a hook, never the library.
- `src/services/`: one HTTP client set-up that asks `AuthClient.getToken()` for every request and attaches `Authorization: Bearer`. Nothing else touches tokens.

## 3. Red: write the failing tests first
With the library adapter mocked:
- `init` starts the **Authorization Code flow with PKCE (S256)** as a public client; configuration (issuer URL, client ID) comes from environment configuration, not code.
- `getToken` refreshes the token when it is close to expiry, and returns the new one.
- If refresh fails, the session ends: `onSessionEnd` listeners fire and the user is sent back to sign in.
- `logout` clears the in-memory state and calls the library's logout with the configured redirect.
- **Nothing is written to `localStorage` or `sessionStorage`**, and nothing token-like is logged (spy on storage and the console).
- `hasRole` reads roles from the configured claim location.

With the mock API and `renderPage`:
- every API request carries the Bearer token from `getToken`, and only the shared client adds it;
- a `401` response ends the session and returns the user to sign in cleanly;
- a `403` response shows the "you do not have permission" message and does **not** sign the user out;
- a role sees the actions it is allowed and no others; a read-only role sees no add, edit or remove action. The test names say this is visibility, not security.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 4. Green: implement
- Configure the library for PKCE S256, a public client, no client secret. Never the implicit flow or password grant.
- Keep the token only in memory (the library instance or a closure). Never persist it and never log it.
- Refresh before expiry (e.g. when fewer than 30 seconds remain), with a single in-flight refresh shared by concurrent requests.
- Map `401` to session end and `403` to a permission error in the shared HTTP client.

Run until green, then the whole suite, type check and lint. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 5. Refactor and E2E
- Tidy with tests green.
- Add or update Playwright E2E tests for sign-in and sign-out with a dedicated test user for each role (they run against the test environment in CI, not locally).
