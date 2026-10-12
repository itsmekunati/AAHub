import { expect, test, type Page } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./accessibility";

// Defaults are the mock directory (src/mocks/data.ts): an internal Scottish Government x number.
// An external (public email) case needs its test domain confirmed: see docs/open-questions.md.
const internalUser = process.env.E2E_ROLE_INTERNAL_USER ?? "x123456";
const lookupButton = "Get user's existing LDAP group memberships";

const heading = (page: Page, name: string) => page.getByRole("heading", { level: 1, name });

async function lookUpInternalUser(page: Page) {
  await page.goto("/role-manager");
  await expect(heading(page, "Provide the user details")).toBeVisible();
  await page.getByRole("textbox").first().fill(internalUser);
  await page.getByRole("button", { name: lookupButton }).click();
  await expect(heading(page, "Review and select LDAP groups")).toBeVisible();
}

test("looks up an internal user and reaches the group selection", async ({ page }) => {
  await lookUpInternalUser(page);
  await expectNoAccessibilityViolations(page);
});

test("changes a group and submits with a ticket", async ({ page }) => {
  await lookUpInternalUser(page);
  await page.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }).check({ force: true });
  await page.getByRole("button", { name: "Review" }).click();
  await expect(heading(page, "Review your selection before submitting")).toBeVisible();
  await page.getByRole("textbox", { name: "Enter the JSM ticket ID associated with this request" }).fill("123456");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(heading(page, "Change success")).toBeVisible();
});
