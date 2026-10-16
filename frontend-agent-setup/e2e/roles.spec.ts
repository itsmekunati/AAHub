import { test } from "@playwright/test";

// Blocked on Okta sign-in (OIDC with PKCE), which is not built yet. Once it is, add a setup
// project that signs in through the real Okta page as the dedicated test users, saves storage
// state under e2e/.auth/ (git-ignored), and un-skip these. See .claude/rules/e2e.md.
test.describe.skip("operator roles (needs Okta)", () => {
  test("editor can use all three tabs", () => {});
  test("viewer sees only User Role Manager and Check existing access", () => {});
  test("viewer gets the permission page on a provisioning address", () => {});
});
