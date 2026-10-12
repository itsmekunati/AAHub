import { test } from "@playwright/test";

// Blocked on Okta sign-in (OIDC with PKCE), which is not built yet. Once it is, add a setup
// project that signs in through the real Okta page as the dedicated test users, saves storage
// state under e2e/.auth/ (git-ignored), and un-skip these. See .claude/rules/e2e.md.
test.describe.skip("operator roles (needs Okta)", () => {
  test("admin can provision and manage roles", () => {});
  test("editor can provision but is blocked from an admin-only action", () => {});
  test("viewer can read but has no add, edit or remove actions", () => {});
});
