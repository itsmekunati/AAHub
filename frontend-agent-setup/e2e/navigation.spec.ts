import { expect, test } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./accessibility";

test.describe("home page", () => {
  test("lists the three tasks", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("#main-content").getByRole("link", { name: "Provision user access to RP&S" }),
    ).toBeVisible();
    await expect(page.locator("#main-content").getByRole("link", { name: "User Role Manager" })).toBeVisible();
    await expect(
      page.locator("#main-content").getByRole("link", { name: "Check user's existing RP&S access" }),
    ).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test("lays the three tasks out as two columns, with the third underneath", async ({ page }) => {
    await page.goto("/");
    const boxes = [];
    for (const name of ["Provision user access to RP&S", "User Role Manager", "Check user's existing RP&S access"]) {
      const box = await page.locator("#main-content").getByRole("link", { name }).boundingBox();
      if (!box) {
        throw new Error(`No "${name}" tile to measure`);
      }
      boxes.push(box);
    }
    const [first, second, third] = boxes;
    expect(Math.abs((first?.y ?? 0) - (second?.y ?? -100))).toBeLessThanOrEqual(2);
    expect(second?.x ?? 0).toBeGreaterThan((first?.x ?? 0) + (first?.width ?? 0));
    expect(third?.y ?? 0).toBeGreaterThan((first?.y ?? 0) + (first?.height ?? 0));
    expect(Math.abs((third?.x ?? 0) - (first?.x ?? -100))).toBeLessThanOrEqual(2);
  });

  test("stacks the three tasks in one column on a narrow screen, without sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    const tops = [];
    for (const name of ["Provision user access to RP&S", "User Role Manager", "Check user's existing RP&S access"]) {
      tops.push((await page.locator("#main-content").getByRole("link", { name }).boundingBox())?.y ?? 0);
    }
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    expect(new Set(tops).size).toBe(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
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
