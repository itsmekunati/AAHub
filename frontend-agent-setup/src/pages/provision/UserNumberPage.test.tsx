import { screen, within } from "@testing-library/react";
import { expectNoAxeViolations } from "../../test/axe";
import { renderApp } from "../../test/render";
import { chooseUserType, findHeading, headings, validateUserNumber } from "./testJourney";

const start = "/provision/user-type";

describe("Enter the user identifier", () => {
  it("AC3: shows the chosen user type, a user identifier field, and Cancel and Validate", async () => {
    const { user } = renderApp({ route: start });
    await findHeading(headings.userType);
    await chooseUserType(user, "Nature");

    expect(screen.getByText("User type")).toBeInTheDocument();
    expect(screen.getByText("Nature")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "User identifier" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Validate" })).toBeInTheDocument();
  });

  it("AC3: asks for a user identifier when the field is empty", async () => {
    const { user } = renderApp({ route: start });
    await findHeading(headings.userType);
    await chooseUserType(user);

    await user.click(screen.getByRole("button", { name: "Validate" }));

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole("link", { name: "Enter a user identifier" })).toHaveAttribute(
      "href",
      "#user-number",
    );
    expect(screen.getByRole("textbox", { name: "User identifier" })).toHaveAccessibleDescription(
      "Error: Enter a user identifier",
    );
  });

  it("AC4: says the user was not found and stays on the same step", async () => {
    const { user } = renderApp({ route: start });
    await findHeading(headings.userType);
    await chooseUserType(user);

    await user.type(screen.getByRole("textbox", { name: "User identifier" }), "999999");
    await user.click(screen.getByRole("button", { name: "Validate" }));

    const summary = await screen.findByRole("alert");
    expect(
      within(summary).getByRole("link", { name: "User not found. Check the user identifier and user type." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: headings.userIdentifier })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "User identifier" })).toHaveValue("999999");
  });

  it("AC4: does not find a user registered under a different user type", async () => {
    const { user } = renderApp({ route: start });
    await findHeading(headings.userType);
    await chooseUserType(user, "Forestry");

    await user.type(screen.getByRole("textbox", { name: "User identifier" }), "U100001");
    await user.click(screen.getByRole("button", { name: "Validate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("User not found");
  });

  it("AC5: shows a checking state while the user is looked up", async () => {
    const { user } = renderApp({ route: start, scenario: "lookupSlow" });
    await findHeading(headings.userType);
    await chooseUserType(user);

    await user.type(screen.getByRole("textbox", { name: "User identifier" }), "U100001");
    await user.click(screen.getByRole("button", { name: "Validate" }));

    expect(await screen.findByRole("button", { name: "Validating" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Checking the user identifier");
  });

  it("AC5: shows a permission message on 403", async () => {
    const { user } = renderApp({ route: start, scenario: "lookupForbidden" });
    await findHeading(headings.userType);
    await chooseUserType(user);

    await user.type(screen.getByRole("textbox", { name: "User identifier" }), "U100001");
    await user.click(screen.getByRole("button", { name: "Validate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You do not have permission to do this. Contact your administrator if you think this is wrong.",
    );
  });

  it("AC5: shows a plain-English message when the service fails", async () => {
    const { user } = renderApp({ route: start, scenario: "lookupServerError" });
    await findHeading(headings.userType);
    await chooseUserType(user);

    await user.type(screen.getByRole("textbox", { name: "User identifier" }), "U100001");
    await user.click(screen.getByRole("button", { name: "Validate" }));

    const summary = await screen.findByRole("alert");
    expect(summary).toHaveTextContent("Sorry, there is a problem with the service. Try again later.");
    expect(summary).not.toHaveTextContent("500");
  });

  it("AC5: shows a plain-English message when the network is down", async () => {
    const { user } = renderApp({ route: start, scenario: "lookupOffline" });
    await findHeading(headings.userType);
    await chooseUserType(user);

    await user.type(screen.getByRole("textbox", { name: "User identifier" }), "U100001");
    await user.click(screen.getByRole("button", { name: "Validate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sorry, there is a problem with the service. Try again later.",
    );
  });

  it("AC3: sends you back to the start if no user type has been chosen", async () => {
    renderApp({ route: "/provision/user-number" });

    expect(await findHeading(headings.userType)).toBeInTheDocument();
  });

  it("AC3: has no accessibility violations, with and without errors", async () => {
    const { container, user } = renderApp({ route: start });
    await findHeading(headings.userType);
    await chooseUserType(user);
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole("button", { name: "Validate" }));
    await expectNoAxeViolations(container);
  });
});

describe("Check this is the right user", () => {
  it("AC6: shows the user's full name with Cancel and Next", async () => {
    const { user } = renderApp({ route: start });
    await findHeading(headings.userType);
    await chooseUserType(user);
    await validateUserNumber(user, "U100001");

    expect(screen.getByText("Alex Example")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("AC6: Cancel returns to the home page and forgets the journey", async () => {
    const { user } = renderApp({ route: start });
    await findHeading(headings.userType);
    await chooseUserType(user);
    await validateUserNumber(user, "U100001");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await findHeading("Home");
    await user.click(screen.getByRole("link", { name: "Provision user access to RP&S" }));

    await findHeading(headings.userType);
    expect(screen.getByRole("radio", { name: "Government" })).not.toBeChecked();
  });

  it("AC6: has no accessibility violations", async () => {
    const { container, user } = renderApp({ route: start });
    await findHeading(headings.userType);
    await chooseUserType(user);
    await validateUserNumber(user, "U100001");

    await expectNoAxeViolations(container);
  });
});
