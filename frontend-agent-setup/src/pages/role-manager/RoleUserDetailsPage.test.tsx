import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/node";
import type { ScenarioName } from "../../mocks/scenarios";
import { expectNoAxeViolations } from "../../test/axe";
import { renderApp } from "../../test/render";
import { testConfig } from "../../test/testConfig";
import {
  findHeading,
  headings,
  identifierField,
  identifierHint,
  publicIdentifierHint,
  start,
  submitIdentifier,
  submitLabel,
  unavailableHint,
} from "./testJourney";
import { identifierMessages } from "./validateIdentifier";

async function openPage(scenario?: ScenarioName) {
  const rendered = renderApp({ route: start, scenario });
  await findHeading(headings.userDetails);
  return rendered;
}

/** Records the path of every LDAP group lookup the page sends. */
function captureLookups(): string[] {
  const paths: string[] = [];
  server.use(
    http.get("*/users/:userIdentifier/ldap-groups", ({ request }) => {
      paths.push(new URL(request.url).pathname);
      return HttpResponse.json({ groups: ["RPS-RegisteredUser"] });
    }),
  );
  return paths;
}

describe("Sanitising the x number or username (User Role Manager)", () => {
  it("AC12: sends exactly the trimmed value", async () => {
    const lookups = captureLookups();
    const { user } = await openPage();

    await user.click(identifierField());
    await user.paste("  x123456  ");
    await user.click(screen.getByRole("button", { name: submitLabel }));
    await findHeading(headings.selectGroups);

    expect(lookups).toEqual(["/api/users/x123456/ldap-groups"]);
  });

  it.each(["x12\u00003456", "jo\tbloggs", "x123​456", "ｘ１２３４５６"])(
    "AC12: never sends %j, and says what is wrong",
    async (value) => {
      const lookups = captureLookups();
      const { user } = await openPage();

      await user.click(identifierField());
      await user.paste(value);
      await user.click(screen.getByRole("button", { name: submitLabel }));

      expect(within(screen.getByRole("alert")).getByRole("link", { name: identifierMessages.characters })).toBeInTheDocument();
      expect(lookups).toEqual([]);
    },
  );

  it("AC12: stops mobile keyboards changing the letter case", async () => {
    await openPage();

    expect(identifierField()).toHaveAttribute("autocapitalize", "off");
  });
});

describe("Provide the user details (User Role Manager)", () => {
  it("AC1: opens from the User Role Manager tab", async () => {
    const { user } = renderApp({ route: "/" });
    await findHeading("Home");

    await user.click(within(screen.getByRole("navigation")).getByRole("link", { name: "User Role Manager" }));

    expect(await findHeading(headings.userDetails)).toBeInTheDocument();
    expect(document.title).toBe("Provide the user details - Application Access Hub");
  });

  it("AC1: shows a Previous link, the environment, the user type and the identifier field", async () => {
    await openPage();

    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("ds_h2");
    expect(screen.getByText("Selected environment")).toBeInTheDocument();
    expect(screen.getByText(testConfig.environmentName)).toBeInTheDocument();

    const userType = screen.getByRole("combobox", { name: "User type" });
    expect(userType).toHaveAccessibleDescription("Select the user type from the dropdown");
    expect(userType).toHaveValue("SG");
    expect(within(userType).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Scottish Government",
      "NatureScot",
      "Scottish Forestry",
      "Public",
    ]);

    expect(identifierField()).toHaveAccessibleDescription(identifierHint);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: submitLabel })).toBeInTheDocument();
  });

  it("AC2: shows the button as unavailable, but still focusable and explained, until the value is valid", async () => {
    const { user } = await openPage();
    const button = screen.getByRole("button", { name: submitLabel });

    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toHaveAttribute("disabled");
    expect(button).toHaveAccessibleDescription(unavailableHint);
    button.focus();
    expect(button).toHaveFocus();

    await user.type(identifierField(), "x12345");
    expect(button).toHaveAttribute("aria-disabled", "true");

    await user.type(identifierField(), "6");
    expect(button).not.toHaveAttribute("aria-disabled");
    expect(button).not.toHaveAccessibleDescription();
  });

  it.each([
    ["ab!c", identifierMessages.characters],
    ["x1234567", identifierMessages.xNumber],
    ["a".repeat(21), identifierMessages.xNumber],
  ])("AC2: shows the error for %s while the operator is still typing", async (value, message) => {
    const { user } = await openPage();

    await user.type(identifierField(), value);

    expect(identifierField()).toHaveFocus();
    expect(identifierField()).toHaveAccessibleDescription(`${identifierHint} Error: ${message}`);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("AC2: waits until the operator leaves the field before saying a value is too short or unfinished", async () => {
    const { user } = await openPage();

    await user.type(identifierField(), "x12");
    expect(identifierField()).not.toHaveAttribute("aria-invalid");

    await user.tab();
    expect(identifierField()).toHaveAccessibleDescription(`${identifierHint} Error: ${identifierMessages.xNumber}`);

    await user.clear(identifierField());
    await user.type(identifierField(), "x12345");
    expect(identifierField()).toHaveAccessibleDescription(`${identifierHint} Error: ${identifierMessages.xNumber}`);

    await user.type(identifierField(), "6");
    expect(identifierField()).not.toHaveAttribute("aria-invalid");
    expect(identifierField()).toHaveAccessibleDescription(identifierHint);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("AC2: pressing the unavailable button shows the error summary and does not look the user up", async () => {
    const { user } = await openPage();
    await user.type(identifierField(), "x12");

    await user.click(screen.getByRole("button", { name: submitLabel }));

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole("link", { name: identifierMessages.xNumber })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: headings.userDetails })).toBeInTheDocument();
  });

  it("AC2: shows the error summary on submit and moves focus to it", async () => {
    const { user } = await openPage();

    await submitIdentifier(user, "9".repeat(25));

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole("link", { name: identifierMessages.xNumber })).toHaveAttribute(
      "href",
      "#user-identifier",
    );
    expect(identifierField()).toHaveAccessibleDescription(`${identifierHint} Error: ${identifierMessages.xNumber}`);
    expect(document.title).toBe("Error: Provide the user details - Application Access Hub");
  });

  it("AC2: asks for a value when the field is empty", async () => {
    const { user } = await openPage();

    await submitIdentifier(user, "");

    expect(within(screen.getByRole("alert")).getByRole("link", { name: identifierMessages.missingXNumber })).toBeInTheDocument();
  });

  it("AC2: removes the summary once the value is fixed, without taking focus from the field", async () => {
    const { user } = await openPage();
    await submitIdentifier(user, "x12345");

    await user.click(identifierField());
    await user.type(identifierField(), "6");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(identifierField()).toHaveFocus();
  });

  it("AC2: a public user is asked for a username of 4 to 20 characters, with its own hint", async () => {
    const { user } = await openPage();
    await user.selectOptions(screen.getByRole("combobox", { name: "User type" }), "public");

    expect(identifierField()).toHaveAccessibleName("Enter the username");
    expect(identifierField()).toHaveAccessibleDescription(publicIdentifierHint);
    expect(screen.getByRole("button", { name: submitLabel })).toHaveAccessibleDescription(
      "Enter a valid username to continue",
    );

    await user.type(identifierField(), "abc");
    await user.tab();
    expect(identifierField()).toHaveAccessibleDescription(`${publicIdentifierHint} Error: ${identifierMessages.length}`);

    await user.type(identifierField(), "d");
    expect(identifierField()).not.toHaveAttribute("aria-invalid");
  });

  it.each([
    ["a".repeat(21), identifierMessages.length],
    ["jo bloggs", identifierMessages.characters],
    ["jo	bloggs", identifierMessages.characters],
  ])("AC2: shows the error for the public username %j while the operator is still typing", async (value, message) => {
    const { user } = await openPage();
    await user.selectOptions(screen.getByRole("combobox", { name: "User type" }), "public");

    await user.click(identifierField());
    await user.paste(value);

    expect(identifierField()).toHaveAccessibleDescription(`${publicIdentifierHint} Error: ${message}`);
  });

  it("AC2: asks a public user for a username when the field is empty", async () => {
    const { user } = await openPage();

    await submitIdentifier(user, "", "public");

    expect(
      within(screen.getByRole("alert")).getByRole("link", { name: identifierMessages.missingUsername }),
    ).toBeInTheDocument();
  });

  it("AC2: does not accept a username for a user type that needs an x number", async () => {
    const lookups = captureLookups();
    const { user } = await openPage();

    await submitIdentifier(user, "jo.bloggs", "SNH");

    expect(within(screen.getByRole("alert")).getByRole("link", { name: identifierMessages.xNumber })).toBeInTheDocument();
    expect(lookups).toEqual([]);
  });

  it("AC2: judges the same value again when the user type changes", async () => {
    const { user } = await openPage();
    await user.type(identifierField(), "jo.bloggs");
    await user.tab();
    expect(identifierField()).toHaveAccessibleDescription(`${identifierHint} Error: ${identifierMessages.xNumber}`);

    await user.selectOptions(screen.getByRole("combobox", { name: "User type" }), "public");
    expect(identifierField()).not.toHaveAttribute("aria-invalid");
    expect(screen.getByRole("button", { name: submitLabel })).not.toHaveAttribute("aria-disabled");

    await user.selectOptions(screen.getByRole("combobox", { name: "User type" }), "FGS");
    expect(identifierField()).toHaveAccessibleDescription(`${identifierHint} Error: ${identifierMessages.xNumber}`);
  });

  it("AC3: disables the button and says it is checking while the request is in flight", async () => {
    const { user } = await openPage("ldapGroupsSlow");

    await submitIdentifier(user, "x123456");

    expect(await screen.findByRole("button", { name: "Getting group memberships" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Getting the user's LDAP group memberships");
  });

  it("AC3: shows the next page with the user's group memberships", async () => {
    const { user } = await openPage();

    await submitIdentifier(user, "x123456");

    expect(await findHeading(headings.selectGroups)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "RPS - RegisteredUser" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" })).not.toBeChecked();
  });

  it("AC3: sends the chosen user type", async () => {
    const { user } = await openPage();

    await submitIdentifier(user, "jo.bloggs", "public");

    expect(await findHeading(headings.selectGroups)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "RPS - RegisteredUser" })).not.toBeChecked();
  });

  it.each([
    ["Scottish Government", "x123456", "SG"],
    ["NatureScot", "x123456", "SNH"],
    ["Scottish Forestry", "x123456", "FGS"],
    ["Public", "jo.bloggs", "public"],
  ])("AC3: looks a %s user up with the backend's user type code", async (userType, identifier, code) => {
    const lookedUp: string[] = [];
    server.use(
      http.get("*/users/:userIdentifier/ldap-groups", ({ request }) => {
        lookedUp.push(new URL(request.url).search);
        return new HttpResponse(null, { status: 404 });
      }),
    );
    const { user } = await openPage();

    await submitIdentifier(user, identifier, userType);

    await waitFor(() => expect(lookedUp).toEqual([`?userType=${code}`]));
  });

  it("AC4: says the user was not found and keeps what was entered", async () => {
    const { user } = await openPage();

    await submitIdentifier(user, "x999999");

    const summary = await screen.findByRole("alert");
    const message = "User not found. Check the x number or username and the user type.";
    expect(within(summary).getByRole("link", { name: message })).toHaveAttribute("href", "#user-identifier");
    expect(identifierField()).toHaveAccessibleDescription(`${identifierHint} Error: ${message}`);
    expect(identifierField()).toHaveValue("x999999");
    expect(screen.getByRole("button", { name: submitLabel })).toBeEnabled();
  });

  it("AC4: shows a permission message on 403", async () => {
    const { user } = await openPage("ldapGroupsForbidden");

    await submitIdentifier(user, "x123456");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You do not have permission to do this. Contact your administrator if you think this is wrong.",
    );
  });

  it.each(["ldapGroupsServerError", "ldapGroupsOffline", "catalogueServerError"] as const)(
    "AC4: shows a plain-English message when the service fails (%s)",
    async (scenario) => {
      const { user } = await openPage(scenario);

      await submitIdentifier(user, "x123456");

      const summary = await screen.findByRole("alert");
      expect(summary).toHaveTextContent("Sorry, there is a problem with the service. Try again later.");
      expect(summary).not.toHaveTextContent("500");
      expect(screen.getByRole("button", { name: submitLabel })).toBeEnabled();
    },
  );

  it("AC5: Cancel returns to the home page and forgets the answers", async () => {
    const { user } = await openPage();
    await user.selectOptions(screen.getByRole("combobox", { name: "User type" }), "public");
    await user.type(identifierField(), "jo.bloggs");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await findHeading("Home");
    await user.click(within(screen.getByRole("main")).getByRole("link", { name: "User Role Manager" }));

    await findHeading(headings.userDetails);
    expect(identifierField()).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "User type" })).toHaveValue("SG");
  });

  it("AC6: has no accessibility violations, with and without errors", async () => {
    const { container, user } = await openPage();
    await expectNoAxeViolations(container);

    await submitIdentifier(user, "ab!c");
    await expectNoAxeViolations(container);
  });
});
