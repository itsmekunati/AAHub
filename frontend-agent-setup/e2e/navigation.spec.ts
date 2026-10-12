import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./accessibility";

test.describe("home page", () => {
  test("lists the three tasks", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#main-content").getByRole("link", { name: "Provision user access to RP&S" })).toBeVisible();
    await expect(page.locator("#main-content").getByRole("link", { name: "User Role Manager" })).toBeVisible();
    await expect(page.locator("#main-content").getByRole("link", { name: "Check user's existing RP&S access" })).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test("starts the provisioning journey", async ({ page }) => {
    await page.goto("/");
    await page.locator("#main-content").getByRole("link", { name: "Provision user access to RP&S" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Select the user type" })).toBeVisible();
  });

  test("starts the role manager journey", async ({ page }) => {
    await page.goto("/");
    await page.locator("#main-content").getByRole("link", { name: "User Role Manager" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Provide the user details" })).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test("shows a not found page for an unknown address", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });
});
