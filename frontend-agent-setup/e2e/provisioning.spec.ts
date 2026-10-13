import { expect, test, type Page } from "@playwright/test";
import { expectNoAccessibilityViolations } from "./accessibility";

// Defaults are the mock directory (src/mocks/data.ts). Against a deployed test environment,
// supply real test identifiers and a JSM ticket through the environment.
const users = {
  "Scottish Government": process.env.E2E_GOVERNMENT_USER ?? "U100001",
  "Scottish Forestry": process.env.E2E_FORESTRY_USER ?? "Z200002",
  NatureScot: process.env.E2E_NATURE_USER ?? "GAKWO300003",
} as const;
type UserType = keyof typeof users;
// Each user type has its own locations. Defaults are the mock lists (src/mocks/data.ts).
const locations: Record<UserType, string> = {
  "Scottish Government": process.env.E2E_GOVERNMENT_LOCATION ?? "Perth",
  "Scottish Forestry": process.env.E2E_FORESTRY_LOCATION ?? "Dumfries",
  NatureScot: process.env.E2E_NATURE_LOCATION ?? "Battleby",
};
const ticketId = process.env.E2E_JSM_TICKET ?? "ITS-123456";
const ticketLabel = "Enter the JSM ticket ID associated with this request";

const heading = (page: Page, name: string) => page.getByRole("heading", { level: 1, name });

// The ribbon heading must be fully visible and centred in its ribbon, as in the design.
async function expectHeadingCentredInRibbon(page: Page, name: string) {
  const title = heading(page, name);
  const ribbon = page.locator(".ds_notification").filter({ has: title });
  const titleBox = await title.boundingBox();
  const ribbonBox = await ribbon.boundingBox();
  if (!titleBox || !ribbonBox) {
    throw new Error(`No ribbon heading "${name}" to measure`);
  }
  expect(titleBox.x).toBeGreaterThanOrEqual(ribbonBox.x);
  expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(ribbonBox.x + ribbonBox.width);
  expect(Math.abs(titleBox.x + titleBox.width / 2 - (ribbonBox.x + ribbonBox.width / 2))).toBeLessThanOrEqual(2);
  // The ribbon spans the full page width, with clear space between the site navigation and itself.
  const layoutBox = await page.locator("#main-content .ds_layout").boundingBox();
  const navigationBox = await page.getByRole("navigation").boundingBox();
  if (!layoutBox || !navigationBox) {
    throw new Error("No page layout or site navigation to measure");
  }
  expect(Math.abs(ribbonBox.width - layoutBox.width)).toBeLessThanOrEqual(1);
  expect(ribbonBox.y - (navigationBox.y + navigationBox.height)).toBeGreaterThanOrEqual(40);
  if (process.env.E2E_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.E2E_SCREENSHOT_DIR}/${name.replaceAll(" ", "-")}.png` });
  }
}

const mockOnly = "Relies on the mock API's data and scenarios";
const userNumberField = (page: Page) => page.getByRole("textbox", { name: /^Enter user's (u\/z\/c|GAKWO) number$/ });
const managerField = (page: Page) => page.getByRole("textbox", { name: "Manager's x number" });
const locationField = (page: Page) => page.getByRole("combobox", { name: "Location" });
const summaryRow = (page: Page, key: string) =>
  page.locator(".ds_summary-list__item").filter({ has: page.getByText(key, { exact: true }) });

// A button shown as unavailable is aria-disabled, not disabled: it stays focusable and pressable.
async function expectUnavailable(page: Page, name: string) {
  await expect(page.getByRole("button", { name })).toHaveAttribute("aria-disabled", "true");
}

async function expectAvailable(page: Page, name: string) {
  await expect(page.getByRole("button", { name })).not.toHaveAttribute("aria-disabled", "true");
}

async function walkToUserNumber(page: Page, userType: UserType, start = "/provision") {
  await page.goto(start);
  await page.getByRole("radio", { name: userType }).check({ force: true });
  await page.getByRole("button", { name: "Next" }).click();
  await expect(heading(page, "Provide the user details")).toBeVisible();
}

async function walkToDetails(page: Page, userType: UserType, start = "/provision") {
  await walkToUserNumber(page, userType, start);
  await userNumberField(page).fill(users[userType]);
  await page.getByRole("button", { name: "Validate user details" }).click();
  await expect(heading(page, "Review your selection before submitting")).toBeVisible();
  await expect(page.getByRole("option", { name: locations[userType] })).toBeAttached();
}

async function walkToTicket(page: Page, userType: UserType, start = "/provision") {
  await walkToDetails(page, userType, start);
  await page.getByRole("combobox", { name: "Location" }).selectOption(locations[userType]);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("textbox", { name: ticketLabel })).toBeVisible();
}

// The mock Forestry user has no job title on purpose (AC8), so it is blocked rather than provisioned.
const mockForestryIsIncomplete = !process.env.E2E_BASE_URL;

for (const userType of Object.keys(users) as UserType[]) {
  test(`provisions a ${userType} user end to end`, async ({ page }) => {
    test.skip(userType === "Scottish Forestry" && mockForestryIsIncomplete, "Covered by the missing job title test below");
    await walkToTicket(page, userType);
    await expectNoAccessibilityViolations(page);
    await page.getByRole("textbox", { name: ticketLabel }).fill(ticketId);
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(heading(page, "Access provisioning success")).toBeVisible();
    await expectHeadingCentredInRibbon(page, "Access provisioning success");
    await expect(page.getByText("has been provisioned successfully")).toBeVisible();
    await expect(page.getByText("Please update any corresponding JSM tickets.")).toBeVisible();

    // Back must not bring the answers back: the journey starts again, empty.
    await page.goBack();
    await expect(heading(page, "Select the user type")).toBeVisible();
    await expect(page.getByRole("radio", { name: userType })).not.toBeChecked();
    await expect(page.locator("#main-content")).not.toContainText(users[userType]);
  });
}

test("rejects a ticket ID in the wrong format", async ({ page }) => {
  await walkToTicket(page, "Scottish Government");
  await page.getByRole("textbox", { name: ticketLabel }).fill("123");
  // Submit is shown as unavailable (aria-disabled) until the ticket is valid; Enter still submits the form.
  await page.getByRole("textbox", { name: ticketLabel }).press("Enter");
  await expect(page.getByText("Enter the 6 numbers from the ITS ticket, for example 123456").first()).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

// Mock mode only: ?scenario=... selects an MSW override (src/mocks/scenarios.ts).
test("shows the failure page when the submission is forbidden", async ({ page }) => {
  test.skip(!!process.env.E2E_BASE_URL, "Scenarios exist only in the mock API");
  await walkToTicket(page, "Scottish Government", "/provision?scenario=submitForbidden");
  await page.getByRole("textbox", { name: ticketLabel }).fill(ticketId);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(heading(page, "Access provisioning failed")).toBeVisible();
  await expectHeadingCentredInRibbon(page, "Access provisioning failed");
  await expect(page.getByRole("heading", { level: 2, name: "Provisioning failure details" })).toBeVisible();
  await expect(page.getByText("has not been provisioned")).toBeVisible();

  await page.goBack();
  await expect(heading(page, "Select the user type")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Scottish Government" })).not.toBeChecked();
});

test("blocks a user whose job title is missing from their record", async ({ page }) => {
  test.skip(!mockForestryIsIncomplete, "Relies on the mock Forestry user having no job title");
  await page.goto("/provision");
  await page.getByRole("radio", { name: "Scottish Forestry" }).check({ force: true });
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("textbox", { name: /^Enter user's (u\/z\/c|GAKWO) number$/ }).fill(users["Scottish Forestry"]);
  await page.getByRole("button", { name: "Validate user details" }).click();
  await expect(page.getByRole("option", { name: locations["Scottish Forestry"] })).toBeAttached();
  await page.getByRole("combobox", { name: "Location" }).selectOption(locations["Scottish Forestry"]);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("alert")).toContainText("The user's job title is missing");
  await expect(heading(page, "Review your selection before submitting")).toBeVisible();
  await expectNoAccessibilityViolations(page);
});

test.describe("select the user type", () => {
  test("offers the three user types and keeps Next unavailable until one is chosen", async ({ page }) => {
    await page.goto("/provision");
    await expect(heading(page, "Select the user type")).toBeVisible();
    await expect(page.getByText("You will be able to select environment after selecting user type")).toBeVisible();
    for (const userType of Object.keys(users)) {
      await expect(page.getByRole("radio", { name: userType })).not.toBeChecked();
    }
    await expectUnavailable(page, "Next");
    await expectNoAccessibilityViolations(page);

    await page.getByRole("radio", { name: "Scottish Forestry" }).check({ force: true });
    await expectAvailable(page, "Next");
  });

  test("pressing Next with nothing chosen shows the error summary", async ({ page }) => {
    await page.goto("/provision");
    await page.getByRole("radio", { name: "Scottish Government" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("alert")).toContainText("Select a user type");
    await expect(page.getByRole("alert")).toBeFocused();
    await expectNoAccessibilityViolations(page);
  });
});

test.describe("provide the user details", () => {
  test("shows the selected user type, Change and Previous stacked above the heading", async ({ page }) => {
    await walkToUserNumber(page, "Scottish Government");
    const tops = [];
    for (const locator of [
      page.getByText("Selected user type:"),
      page.locator("#main-content").getByText("Scottish Government", { exact: true }),
      page.getByRole("link", { name: "Change user type" }),
      heading(page, "Provide the user details"),
    ]) {
      await expect(locator).toBeVisible();
      tops.push((await locator.boundingBox())?.y ?? 0);
    }
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    expect(new Set(tops).size).toBe(tops.length);
    await expectNoAccessibilityViolations(page);

    await page.getByRole("link", { name: "Previous" }).click();
    await expect(heading(page, "Select the user type")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Scottish Government" })).toBeChecked();
  });

  test("checks the user number as it is typed and keeps the button unavailable until it fits", async ({ page }) => {
    await walkToUserNumber(page, "Scottish Government");
    const formatError = "User numbers must be u, z or c followed by six digits, for example u111111";
    await expect(page.getByText("Use the following format: U, Z or C number, for example u111111")).toBeVisible();
    await expectUnavailable(page, "Validate user details");

    await userNumberField(page).pressSequentially("x1");
    await expect(page.getByText(formatError)).toBeVisible();
    await expectUnavailable(page, "Validate user details");
    await expectNoAccessibilityViolations(page);

    await userNumberField(page).fill("u12");
    await expect(page.getByText(formatError)).toBeHidden();
    await userNumberField(page).blur();
    await expect(page.getByText(formatError)).toBeVisible();

    for (const valid of ["u111111", "Z200002", "c123456"]) {
      await userNumberField(page).fill(valid);
      await expectAvailable(page, "Validate user details");
    }
  });

  test("asks a NatureScot user for a GAKWO number", async ({ page }) => {
    await walkToUserNumber(page, "NatureScot");
    await expect(page.getByRole("textbox", { name: "Enter user's GAKWO number" })).toBeVisible();
    await expect(page.getByText("Use the following format: GAKWO number, for example GAKWO111111")).toBeVisible();

    await userNumberField(page).fill("u111111");
    await expect(page.getByText("GAKWO numbers must be GAKWO followed by six digits")).toBeVisible();
    await expectUnavailable(page, "Validate user details");

    await userNumberField(page).fill("gakwo111111");
    await expectAvailable(page, "Validate user details");
  });

  test("says when the user is not found", async ({ page }) => {
    test.skip(!!process.env.E2E_BASE_URL, mockOnly);
    await walkToUserNumber(page, "Scottish Forestry");
    await userNumberField(page).fill(users["Scottish Government"]);
    await page.getByRole("button", { name: "Validate user details" }).click();
    await expect(page.getByRole("alert")).toContainText("User not found. Check the user number and user type.");
    await expect(heading(page, "Provide the user details")).toBeVisible();
  });
});

test.describe("review your selection: user details", () => {
  test("shows the selection and the retrieved details, with Change links", async ({ page }) => {
    await walkToDetails(page, "Scottish Government");
    await expect(summaryRow(page, "Selected user type")).toContainText("Scottish Government");
    await expect(summaryRow(page, "Selected user")).toContainText(users["Scottish Government"]);
    await expect(summaryRow(page, "Selected environment").getByRole("link")).toHaveCount(0);
    for (const key of ["First name", "Last name", "Email address", "Job title"]) {
      await expect(summaryRow(page, key)).toBeVisible();
    }
    await expect(managerField(page)).toHaveValue("");
    await expectNoAccessibilityViolations(page);

    await page.getByRole("link", { name: "Change selected user type" }).click();
    await expect(heading(page, "Select the user type")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Scottish Government" })).toBeChecked();
  });

  test("Previous and Change selected user go back to the user number, which is kept", async ({ page }) => {
    await walkToDetails(page, "Scottish Government");
    await page.getByRole("link", { name: "Previous" }).click();
    await expect(userNumberField(page)).toHaveValue(users["Scottish Government"]);

    await page.getByRole("button", { name: "Validate user details" }).click();
    await expect(heading(page, "Review your selection before submitting")).toBeVisible();
    await page.getByRole("link", { name: "Change selected user", exact: true }).click();
    await expect(userNumberField(page)).toHaveValue(users["Scottish Government"]);
  });

  test("keeps Next unavailable until a location is chosen and the manager's x number is valid or blank", async ({ page }) => {
    await walkToDetails(page, "Scottish Government");
    const managerError = "Manager's x number must be x followed by six digits, for example x111111";
    await expectUnavailable(page, "Next");

    await locationField(page).selectOption(locations["Scottish Government"]);
    await expectAvailable(page, "Next");

    await managerField(page).fill("x12");
    await expect(page.getByText(managerError)).toBeHidden();
    await managerField(page).blur();
    await expect(page.getByText(managerError)).toBeVisible();
    await expectUnavailable(page, "Next");
    await expectNoAccessibilityViolations(page);

    await managerField(page).fill("u1");
    await expect(page.getByText(managerError)).toBeVisible();

    await managerField(page).fill("x123456");
    await expect(page.getByText(managerError)).toBeHidden();
    await expectAvailable(page, "Next");
  });

  for (const [userType, expected] of [
    ["Scottish Government", ["Perth", "SASA", "House", "Inverness"]],
    ["Scottish Forestry", ["Silvan House", "Dumfries", "Dingwall"]],
    ["NatureScot", ["Great Glen House", "Battleby", "Golspie"]],
  ] as const) {
    test(`offers a ${userType} user that user type's own locations`, async ({ page }) => {
      test.skip(!!process.env.E2E_BASE_URL, mockOnly);
      await walkToDetails(page, userType);
      await expect(locationField(page).getByRole("option")).toHaveText(["Select location from dropdown", ...expected]);
    });
  }
});

test.describe("review your selection: JSM ticket", () => {
  test("shows everything to be submitted, with the typed manager's x number, and Previous keeps the answers", async ({ page }) => {
    await walkToDetails(page, "Scottish Government");
    await managerField(page).fill("x123456");
    await locationField(page).selectOption(locations["Scottish Government"]);
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("textbox", { name: ticketLabel })).toBeVisible();

    await expect(page.getByText("You are updating the details of an existing request.")).toBeVisible();
    await expect(summaryRow(page, "Selected user")).toContainText(users["Scottish Government"]);
    await expect(summaryRow(page, "Manager's x number")).toContainText("x123456");
    await expect(summaryRow(page, "Location")).toContainText(locations["Scottish Government"]);
    await expect(page.getByRole("heading", { level: 2, name: ticketLabel })).toBeVisible();

    await page.getByRole("link", { name: "Previous" }).click();
    await expect(managerField(page)).toHaveValue("x123456");
    await expect(locationField(page)).toHaveValue(locations["Scottish Government"]);
  });

  test("shows dummy when the manager's x number was left blank", async ({ page }) => {
    await walkToTicket(page, "Scottish Government");
    await expect(summaryRow(page, "Manager's x number")).toContainText("dummy");
  });

  test("checks the ticket as it is typed and keeps Submit unavailable until it is six numbers", async ({ page }) => {
    await walkToTicket(page, "Scottish Government");
    const ticket = page.getByRole("textbox", { name: ticketLabel });
    const formatError = "Enter the 6 numbers from the ITS ticket, for example 123456";
    await expect(
      page.getByText("Enter just the numbers from the ITS ticket. This is required for audit purposes and is a mandatory field."),
    ).toBeVisible();
    await expectUnavailable(page, "Submit");

    await ticket.pressSequentially("12a");
    await expect(page.getByText(formatError)).toBeVisible();
    await expectUnavailable(page, "Submit");

    await ticket.fill("12345");
    await expect(page.getByText(formatError)).toBeHidden();
    await expectUnavailable(page, "Submit");

    await ticket.fill("123456");
    await expectAvailable(page, "Submit");
  });

  test("sends ITS- with the six numbers and shows the new user's x number", async ({ page }) => {
    test.skip(!!process.env.E2E_BASE_URL, mockOnly);
    await walkToTicket(page, "Scottish Government");
    const request = page.waitForRequest((candidate) => candidate.url().includes("/provisioning-requests"));
    await page.getByRole("textbox", { name: ticketLabel }).fill("123456");
    await page.getByRole("button", { name: "Submit" }).click();

    expect((await request).postDataJSON()).toMatchObject({
      userType: "SG",
      jiraTicketId: "ITS-123456",
      managerXNumber: "dummy",
    });
    await expect(heading(page, "Access provisioning success")).toBeVisible();
    await expect(page.getByText(/User's x number for .+ environment is x500001\./)).toBeVisible();
    await expect(page.locator("#main-content")).not.toContainText("Transaction ID");
    await expectNoAccessibilityViolations(page);
    await page.getByRole("link", { name: "Go to Home Page" }).click();
    await expect(heading(page, "Home")).toBeAttached();
  });
});

test.describe("access provisioning failed", () => {
  for (const [scenario, reason] of [
    ["submitServerError", "Sorry, there is a problem with the service. Try again later."],
    ["submitOffline", "Sorry, there is a problem with the service. Try again later."],
  ] as const) {
    test(`shows the failure details for ${scenario}`, async ({ page }) => {
      test.skip(!!process.env.E2E_BASE_URL, mockOnly);
      await walkToTicket(page, "NatureScot", `/provision?scenario=${scenario}`);
      await page.getByRole("textbox", { name: ticketLabel }).fill("123456");
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(heading(page, "Access provisioning failed")).toBeVisible();
      const details = page.locator(".app_failure-details");
      await expect(details).toContainText("The NatureScot user");
      await expect(details).toContainText("has not been provisioned.");
      await expect(details).toContainText(`Provisioning failure details: ${reason}`);
      await expect(details).toContainText("Please update any corresponding JSM tickets and escalate to the relevant team.");
      await expect(page.getByRole("link", { name: "Try again" })).toHaveCount(0);
      await expectNoAccessibilityViolations(page);
      await page.getByRole("link", { name: "Go to Home Page" }).click();
      await expect(heading(page, "Home")).toBeAttached();
    });
  }
});
