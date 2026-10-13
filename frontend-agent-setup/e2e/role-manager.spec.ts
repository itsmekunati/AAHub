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

// The step headings are shown at the same, smaller size in both journeys.
test("shows its step headings at the same size as the provisioning journey", async ({ page }) => {
  const fontSize = (name: string) => heading(page, name).evaluate((element) => getComputedStyle(element).fontSize);

  await page.goto("/provision");
  const provisioning = await fontSize("Select the user type");

  await page.goto("/role-manager");
  expect(await fontSize("Provide the user details")).toBe(provisioning);
  await page.getByRole("textbox").first().fill(internalUser);
  await page.getByRole("button", { name: lookupButton }).click();
  expect(await fontSize("Review and select LDAP groups")).toBe(provisioning);
  await page.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }).check({ force: true });
  await page.getByRole("button", { name: "Review" }).click();
  expect(await fontSize("Review your selection before submitting")).toBe(provisioning);
  await expectNoAccessibilityViolations(page);
});

// Mock mode only: ?scenario=... selects an MSW override (src/mocks/scenarios.ts).
test("shows the change failure page, with its heading centred in the ribbon", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Scenarios exist only in the mock API");
  await page.goto("/role-manager?scenario=roleChangeServerError");
  await page.getByRole("textbox").first().fill(internalUser);
  await page.getByRole("button", { name: lookupButton }).click();
  await page.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }).check({ force: true });
  await page.getByRole("button", { name: "Review" }).click();
  await page.getByRole("textbox", { name: "Enter the JSM ticket ID associated with this request" }).fill("123456");
  await page.getByRole("button", { name: "Submit" }).click();

  const title = heading(page, "Change failure");
  await expect(title).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "User role manager failure details" })).toBeVisible();
  const titleBox = await title.boundingBox();
  const ribbonBox = await page.locator(".ds_notification").filter({ has: title }).boundingBox();
  if (!titleBox || !ribbonBox) {
    throw new Error("No ribbon heading to measure");
  }
  expect(titleBox.x).toBeGreaterThanOrEqual(ribbonBox.x);
  expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(ribbonBox.x + ribbonBox.width);
  expect(Math.abs(titleBox.x + titleBox.width / 2 - (ribbonBox.x + ribbonBox.width / 2))).toBeLessThanOrEqual(2);
  await expectNoAccessibilityViolations(page);
});
