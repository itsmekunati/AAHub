import { screen, waitFor, within } from "@testing-library/react";
import type { ScenarioName } from "../../mocks/scenarios";
import { expectNoAxeViolations } from "../../test/axe";
import { renderApp } from "../../test/render";
import {
  chooseUserType,
  completeUserDetails,
  findHeading,
  headings,
  locationPlaceholder,
  ticketLabel,
  userNumberField,
  validateUserNumber,
  walkToUserDetails,
} from "./testJourney";

const start = "/provision/user-type";
const managerError = "Manager's x number must be x followed by six digits, for example x111111";

async function openDetails(userType = "Scottish Government", userIdentifier = "U100001", scenario?: ScenarioName) {
  const rendered = renderApp({ route: start, scenario });
  await findHeading(headings.userType);
  await walkToUserDetails(rendered.user, userType, userIdentifier);
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

const managerField = () => screen.getByRole("textbox", { name: "Manager's x number" });
const locationField = () => screen.getByRole("combobox", { name: "Location" });
const nextButton = () => screen.getByRole("button", { name: "Next" });

async function chooseLocation(user: Awaited<ReturnType<typeof openDetails>>["user"], location = "Perth") {
  await screen.findByRole("option", { name: location });
  await user.selectOptions(locationField(), location);
}

describe("Review your selection before submitting", () => {
  it("AC7: comes straight after the user number is validated, with a smaller page heading", async () => {
    await openDetails();

    expect(screen.getByRole("heading", { level: 1, name: headings.userDetails })).toHaveClass("ds_h2");
    await waitFor(() =>
      expect(document.title).toBe("Review your selection before submitting - Application Access Hub"),
    );
    expect(
      screen.getByText("Review the user data below and add additional mandatory fields before clicking Next."),
    ).toBeInTheDocument();
  });

  it("AC7: shows the environment, user type and user, with Change links for the last two", async () => {
    await openDetails();

    expect(summaryRow("Selected environment")).toHaveTextContent("Test environment");
    expect(within(summaryRow("Selected environment")).queryByRole("link")).not.toBeInTheDocument();
    expect(summaryRow("Selected user type")).toHaveTextContent("Scottish Government");
    expect(
      within(summaryRow("Selected user type")).getByRole("link", { name: "Change selected user type" }),
    ).toBeInTheDocument();
    expect(summaryRow("Selected user")).toHaveTextContent("U100001");
    expect(within(summaryRow("Selected user")).getByRole("link", { name: "Change selected user" })).toBeInTheDocument();
  });

  it("AC7: Previous goes back to the user number, with the number kept", async () => {
    const { user } = await openDetails();

    await user.click(screen.getByRole("link", { name: "Previous" }));

    await findHeading(headings.userIdentifier);
    expect(userNumberField()).toHaveValue("U100001");
  });

  it("AC7: shows the retrieved details as read-only, without the manager's x number", async () => {
    await openDetails();

    expect(screen.getByText("These user details have been retrieved from Okta via BI.")).toBeInTheDocument();
    expect(summaryRow("First name")).toHaveTextContent("Alex");
    expect(summaryRow("Last name")).toHaveTextContent("Example");
    expect(summaryRow("Email address")).toHaveTextContent("alex.example@example.test");
    expect(summaryRow("Job title")).toHaveTextContent("Policy officer");
    expect(within(summaryRow("First name")).queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("X000001")).not.toBeInTheDocument();
  });

  it("AC7: explains what the operator has to add, under its own heading", async () => {
    await openDetails();

    expect(
      screen.getByRole("heading", { level: 2, name: "Enter user data required for the provisioning request" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The fields below are mandatory in order to create a User Provisioning request. If you leave manager's x number blank, a dummy value will be added into RP&S. You must select a location to continue.",
      ),
    ).toBeInTheDocument();
  });

  it("AC7: starts with an empty manager's x number, even though the record has one", async () => {
    await openDetails();

    expect(managerField()).toHaveValue("");
  });

  it("AC7: offers the locations from the backend, with none chosen", async () => {
    await openDetails();

    await screen.findByRole("option", { name: "Perth" });
    expect(within(locationField()).getAllByRole("option").map((option) => option.textContent)).toEqual([
      locationPlaceholder,
      "Perth",
      "SASA",
      "House",
      "Inverness",
    ]);
    expect(locationField()).toHaveValue("");
  });

  it.each([
    ["Scottish Forestry", "Z200002", ["Silvan House", "Dumfries", "Dingwall"]],
    ["NatureScot", "GAKWO300003", ["Great Glen House", "Battleby", "Golspie"]],
  ])("AC7: offers a %s user that user type's own locations", async (userType, userIdentifier, locations) => {
    await openDetails(userType, userIdentifier);

    await screen.findByRole("option", { name: locations[0] });
    expect(within(locationField()).getAllByRole("option").map((option) => option.textContent)).toEqual([
      locationPlaceholder,
      ...locations,
    ]);
    expect(screen.queryByRole("option", { name: "Perth" })).not.toBeInTheDocument();
  });

  it("AC9: changing the user type replaces the locations and forgets the one chosen", async () => {
    const { user } = await openDetails();
    await completeUserDetails(user, "Perth");

    await user.click(screen.getByRole("link", { name: "Change selected user type" }));
    await findHeading(headings.userType);
    await chooseUserType(user, "NatureScot");
    await validateUserNumber(user, "GAKWO300003");

    await screen.findByRole("option", { name: "Battleby" });
    expect(screen.queryByRole("option", { name: "Perth" })).not.toBeInTheDocument();
    expect(locationField()).toHaveValue("");
    expect(nextButton()).toHaveAttribute("aria-disabled", "true");
  });

  it("AC7: says when the locations are loading", async () => {
    await openDetails("Scottish Government", "U100001", "locationsSlow");

    expect(screen.getByRole("status")).toHaveTextContent("Loading locations");
    expect(locationField()).toBeDisabled();
  });

  it("AC7: says when the locations cannot be loaded", async () => {
    await openDetails("Scottish Government", "U100001", "locationsServerError");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sorry, the list of locations could not be loaded. Try again later.",
    );
  });

  it("AC8: shows Next as unavailable, and says why, until a location is selected", async () => {
    const { user } = await openDetails();

    expect(nextButton()).toHaveAttribute("aria-disabled", "true");
    expect(nextButton()).toBeEnabled();
    expect(nextButton()).toHaveAccessibleDescription("Select a location to continue");

    await chooseLocation(user);

    expect(nextButton()).not.toHaveAttribute("aria-disabled");
    expect(nextButton()).not.toHaveAccessibleDescription();
  });

  it("AC8: shows Next as unavailable while a typed manager's x number is in the wrong format", async () => {
    const { user } = await openDetails();
    await chooseLocation(user);

    await user.type(managerField(), "x12345");
    expect(nextButton()).toHaveAttribute("aria-disabled", "true");
    expect(nextButton()).toHaveAccessibleDescription("Enter a valid manager's x number, or leave it blank, to continue");

    await user.type(managerField(), "6");
    expect(nextButton()).not.toHaveAttribute("aria-disabled");
  });

  it.each(["u", "x1a", "x1234567"])(
    "AC8: says the manager's x number %s is in the wrong format while it is typed",
    async (value) => {
      const { user } = await openDetails();

      await user.type(managerField(), value);

      expect(managerField()).toHaveAccessibleDescription(`Error: ${managerError}`);
      expect(managerField()).toHaveFocus();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    },
  );

  it("AC8: waits until the field is left before saying an unfinished manager's x number is wrong", async () => {
    const { user } = await openDetails();

    await user.type(managerField(), "x12");
    expect(managerField()).not.toHaveAccessibleDescription();

    await user.tab();
    expect(managerField()).toHaveAccessibleDescription(`Error: ${managerError}`);
  });

  it("AC8: asks for a location and moves focus to the error summary", async () => {
    const { user } = await openDetails();
    await screen.findByRole("option", { name: "Perth" });

    await user.click(nextButton());

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole("link", { name: "Select a location" })).toHaveAttribute("href", "#location");
    expect(locationField()).toHaveAccessibleDescription("Error: Select a location");
  });

  it("AC8: will not continue with a manager's x number in the wrong format", async () => {
    const { user } = await openDetails();
    await chooseLocation(user);
    await user.type(managerField(), "x12");

    await user.click(nextButton());

    const summary = screen.getByRole("alert");
    expect(within(summary).getByRole("link", { name: managerError })).toHaveAttribute("href", "#manager-x-number");
    expect(screen.getByRole("heading", { level: 1, name: headings.userDetails })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: ticketLabel })).not.toBeInTheDocument();
  });

  it("AC8: will not continue when a retrieved mandatory detail is missing", async () => {
    const { user } = await openDetails("Scottish Forestry", "Z200002");
    await chooseLocation(user, "Dumfries");
    expect(summaryRow("Job title")).toHaveTextContent("Not provided");

    await user.click(nextButton());

    const summary = screen.getByRole("alert");
    expect(summary).toHaveTextContent(
      "The user's job title is missing. It must be added to their record before you can continue.",
    );
    expect(screen.getByRole("heading", { level: 1, name: headings.userDetails })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: ticketLabel })).not.toBeInTheDocument();
  });

  it("AC9: Change selected user type goes back with the current choice kept", async () => {
    const { user } = await openDetails("NatureScot", "GAKWO300003");

    await user.click(screen.getByRole("link", { name: "Change selected user type" }));

    await findHeading(headings.userType);
    expect(screen.getByRole("radio", { name: "NatureScot" })).toBeChecked();
  });

  it("AC9: Change selected user goes back with the current number kept", async () => {
    const { user } = await openDetails();

    await user.click(screen.getByRole("link", { name: "Change selected user" }));

    await findHeading(headings.userIdentifier);
    expect(userNumberField()).toHaveValue("U100001");
  });

  it("AC7: moves to the JSM/Jira ticket step with a location and no manager's x number", async () => {
    const { user } = await openDetails();

    await chooseLocation(user, "Inverness");
    await user.click(nextButton());

    expect(await screen.findByRole("textbox", { name: ticketLabel })).toBeInTheDocument();
  });

  it("AC9: keeps the manager's x number and location when the operator comes back to the page", async () => {
    const { user } = await openDetails();
    await user.type(managerField(), "x123456");
    await chooseLocation(user, "SASA");
    await user.click(nextButton());
    expect(await screen.findByRole("textbox", { name: ticketLabel })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Change selected user" }));
    await findHeading(headings.userIdentifier);
    await user.click(screen.getByRole("button", { name: "Validate user details" }));

    await findHeading(headings.userDetails);
    expect(managerField()).toHaveValue("x123456");
    await screen.findByRole("option", { name: "SASA" });
    expect(locationField()).toHaveValue("SASA");
  });

  it("AC6: Cancel returns to the home page and forgets the journey", async () => {
    const { user } = await openDetails();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await findHeading("Home");
    await user.click(screen.getByRole("link", { name: "Provision user access to RP&S" }));

    await findHeading(headings.userType);
    expect(screen.getByRole("radio", { name: "Scottish Government" })).not.toBeChecked();
  });

  it("AC7: sends you back to the start if no user has been validated", async () => {
    renderApp({ route: "/provision/user-details" });

    expect(await findHeading(headings.userType)).toBeInTheDocument();
  });

  it("AC7: has no accessibility violations, with and without errors", async () => {
    const { container, user } = await openDetails();
    await screen.findByRole("option", { name: "Perth" });
    await expectNoAxeViolations(container);

    await user.type(managerField(), "x1");
    await user.click(nextButton());
    await expectNoAxeViolations(container);
  });
});
