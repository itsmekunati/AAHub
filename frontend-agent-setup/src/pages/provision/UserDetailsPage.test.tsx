import { screen, within } from "@testing-library/react";
import type { ScenarioName } from "../../mocks/scenarios";
import { expectNoAxeViolations } from "../../test/axe";
import { renderApp } from "../../test/render";
import { findHeading, headings, walkToUserDetails } from "./testJourney";

const start = "/provision/user-type";

async function openDetails(userType = "Government", userNumber = "100001", scenario?: ScenarioName) {
  const rendered = renderApp({ route: start, scenario });
  await findHeading(headings.userType);
  await walkToUserDetails(rendered.user, userType, userNumber);
  return rendered;
}

function summaryRow(key: string) {
  const term = screen.getByText(key, { selector: ".ds_summary-list__key" });
  const row = term.closest(".ds_summary-list__item");
  if (!(row instanceof HTMLElement)) {
    throw new Error(`No summary row for ${key}`);
  }
  return row;
}

describe("Check and complete the user details", () => {
  it("AC7: shows user type, user number and environment, with Change links for the first two", async () => {
    await openDetails();

    expect(summaryRow("User type")).toHaveTextContent("Government");
    expect(within(summaryRow("User type")).getByRole("link", { name: "Change user type" })).toBeInTheDocument();
    expect(summaryRow("User number")).toHaveTextContent("100001");
    expect(within(summaryRow("User number")).getByRole("link", { name: "Change user number" })).toBeInTheDocument();
    expect(summaryRow("Environment")).toHaveTextContent("Test environment");
    expect(within(summaryRow("Environment")).queryByRole("link")).not.toBeInTheDocument();
  });

  it("AC7: explains the fields are mandatory and have been retrieved", async () => {
    await openDetails();

    expect(
      screen.getByText("The fields below are mandatory in order to create a user provisioning request."),
    ).toBeInTheDocument();
    expect(screen.getByText("The user details have been retrieved.")).toBeInTheDocument();
  });

  it("AC7: shows the retrieved details as read-only", async () => {
    await openDetails();

    expect(summaryRow("First name")).toHaveTextContent("Alex");
    expect(summaryRow("Last name")).toHaveTextContent("Example");
    expect(summaryRow("Email address")).toHaveTextContent("alex.example@example.test");
    expect(summaryRow("Job title")).toHaveTextContent("Policy officer");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(summaryRow("First name")).queryByRole("link")).not.toBeInTheDocument();
  });

  it("AC7: offers the locations from the backend, with none chosen", async () => {
    await openDetails();

    await screen.findByRole("option", { name: "Perth" });
    const location = screen.getByRole("combobox", { name: "Location" });
    expect(within(location).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Select a location",
      "Perth",
      "SASA",
      "House",
      "Inverness",
    ]);
    expect(location).toHaveValue("");
  });

  it("AC7: says when the locations are loading", async () => {
    await openDetails("Government", "100001", "locationsSlow");

    expect(screen.getByRole("status")).toHaveTextContent("Loading locations");
    expect(screen.getByRole("combobox", { name: "Location" })).toBeDisabled();
  });

  it("AC7: says when the locations cannot be loaded", async () => {
    await openDetails("Government", "100001", "locationsServerError");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sorry, the list of locations could not be loaded. Try again later.",
    );
  });

  it("AC8: asks for a location and moves focus to the error summary", async () => {
    const { user } = await openDetails();
    await screen.findByRole("option", { name: "Perth" });

    await user.click(screen.getByRole("button", { name: "Next" }));

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole("link", { name: "Select a location" })).toHaveAttribute("href", "#location");
    expect(screen.getByRole("combobox", { name: "Location" })).toHaveAccessibleDescription("Error: Select a location");
  });

  it("AC8: will not continue when a retrieved mandatory detail is missing", async () => {
    const { user } = await openDetails("Forestry", "200002");
    await screen.findByRole("option", { name: "Perth" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Location" }), "Perth");
    expect(summaryRow("Job title")).toHaveTextContent("Not provided");

    await user.click(screen.getByRole("button", { name: "Next" }));

    const summary = screen.getByRole("alert");
    expect(summary).toHaveTextContent(
      "The user's job title is missing. It must be added to their record before you can continue.",
    );
    expect(screen.getByRole("heading", { level: 1, name: headings.userDetails })).toBeInTheDocument();
  });

  it("AC9: Change user type goes back with the current choice kept", async () => {
    const { user } = await openDetails("Nature", "300003");

    await user.click(screen.getByRole("link", { name: "Change user type" }));

    await findHeading(headings.userType);
    expect(screen.getByRole("radio", { name: "Nature" })).toBeChecked();
  });

  it("AC9: Change user number goes back with the current number kept", async () => {
    const { user } = await openDetails();

    await user.click(screen.getByRole("link", { name: "Change user number" }));

    await findHeading(headings.userNumber);
    expect(screen.getByRole("textbox", { name: "User number" })).toHaveValue("100001");
  });

  it("AC7: moves to the JIRA ticket step once complete", async () => {
    const { user } = await openDetails();

    await screen.findByRole("option", { name: "Inverness" });
    await user.selectOptions(screen.getByRole("combobox", { name: "Location" }), "Inverness");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await findHeading(headings.ticket)).toBeInTheDocument();
  });

  it("AC7: sends you back to the start if no user has been validated", async () => {
    renderApp({ route: "/provision/user-details" });

    expect(await findHeading(headings.userType)).toBeInTheDocument();
  });

  it("AC7: has no accessibility violations, with and without errors", async () => {
    const { container, user } = await openDetails();
    await screen.findByRole("option", { name: "Perth" });
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole("button", { name: "Next" }));
    await expectNoAxeViolations(container);
  });
});
