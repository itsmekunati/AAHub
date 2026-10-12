import { expect, test, type Page } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./accessibility";

// Defaults are the mock directory (src/mocks/data.ts). Against a deployed test environment,
// supply real test identifiers and a JSM ticket through the environment.
const users = {
  Government: process.env.E2E_GOVERNMENT_USER ?? "U100001",
  Forestry: process.env.E2E_FORESTRY_USER ?? "Z200002",
  Nature: process.env.E2E_NATURE_USER ?? "GAKWO300003",
} as const;
type UserType = keyof typeof users;
const ticketId = process.env.E2E_JSM_TICKET ?? "ITS-123456";
const ticketLabel = "Enter the JSM/Jira ticket ID associated with this request";

const heading = (page: Page, name: string) => page.getByRole("heading", { level: 1, name });

async function walkToTicket(page: Page, userType: UserType, start = "/provision") {
  await page.goto(start);
  await page.getByRole("radio", { name: userType }).check({ force: true });
  await page.getByRole("button", { name: "Next" }).click();
  await expect(heading(page, "Enter the user identifier")).toBeVisible();
  await page.getByRole("textbox", { name: "User identifier" }).fill(users[userType]);
  await page.getByRole("button", { name: "Validate" }).click();
  await expect(heading(page, "Check this is the right user")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(heading(page, "Check and complete the user details")).toBeVisible();
  await expect(page.getByRole("option", { name: "Perth" })).toBeAttached();
  await page.getByRole("combobox", { name: "Location" }).selectOption("Perth");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(heading(page, "Add the JSM/Jira ticket ID")).toBeVisible();
}

// The mock Forestry user has no job title on purpose (AC8), so it is blocked rather than provisioned.
const mockForestryIsIncomplete = !process.env.E2E_BASE_URL;

for (const userType of Object.keys(users) as UserType[]) {
  test(`provisions a ${userType} user end to end`, async ({ page }) => {
    test.skip(userType === "Forestry" && mockForestryIsIncomplete, "Covered by the missing job title test below");
    await walkToTicket(page, userType);
    await expectNoAccessibilityViolations(page);
    await page.getByRole("textbox", { name: ticketLabel }).fill(ticketId);
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(heading(page, "Access provisioning success")).toBeVisible();
    await expect(page.getByText("Transaction ID")).toBeVisible();
  });
}

test("rejects a ticket ID in the wrong format", async ({ page }) => {
  await walkToTicket(page, "Government");
  await page.getByRole("textbox", { name: ticketLabel }).fill("123");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("in the correct format: ITS- followed by six digits").first()).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

// Mock mode only: ?scenario=... selects an MSW override (src/mocks/scenarios.ts).
test("shows the failure page when the submission is forbidden", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Scenarios exist only in the mock API");
  await walkToTicket(page, "Government", "/provision?scenario=submitForbidden");
  await page.getByRole("textbox", { name: ticketLabel }).fill(ticketId);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(heading(page, "Access provisioning failed")).toBeVisible();
});

test("blocks a user whose job title is missing from their record", async ({ page }) => {
  test.skip(!mockForestryIsIncomplete, "Relies on the mock Forestry user having no job title");
  await page.goto("/provision");
  await page.getByRole("radio", { name: "Forestry" }).check({ force: true });
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("textbox", { name: "User identifier" }).fill(users.Forestry);
  await page.getByRole("button", { name: "Validate" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("option", { name: "Perth" })).toBeAttached();
  await page.getByRole("combobox", { name: "Location" }).selectOption("Perth");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("alert")).toContainText("The user's job title is missing");
  await expect(heading(page, "Check and complete the user details")).toBeVisible();
  await expectNoAccessibilityViolations(page);
});
