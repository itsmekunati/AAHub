import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/node";
import type { ScenarioName } from "../../mocks/scenarios";
import { expectNoAxeViolations } from "../../test/axe";
import { renderApp } from "../../test/render";
import { chooseUserType, findHeading, headings, userNumberField } from "./testJourney";

const start = "/provision/user-type";
const numberHint = "Use the following format: U, Z or C number, for example u111111";
const numberError = "User numbers must be u, z or c followed by six digits, for example u111111";
const notFound = "User not found. Check the user number and user type.";

async function openUserNumber(userType?: string, scenario?: ScenarioName) {
  const rendered = renderApp({ route: start, scenario });
  await findHeading(headings.userType);
  await chooseUserType(rendered.user, userType);
  return rendered;
}

const validateButton = () => screen.getByRole("button", { name: "Validate user details" });

describe("Provide the user details", () => {
  it("AC3: shows a Previous link and the selected user type, with a Change link, above the heading", async () => {
    const { user } = await openUserNumber("Scottish Forestry");

    const heading = screen.getByRole("heading", { level: 1, name: headings.userIdentifier });
    expect(heading).toHaveClass("ds_h2");
    // Three lines, one under the other: the label, the user type, then the Change link.
    const lines = [
      screen.getByText("Selected user type:").closest("p"),
      screen.getByText("Scottish Forestry").closest("p"),
      screen.getByRole("link", { name: "Change user type" }).closest("p"),
      heading,
    ];
    expect(new Set(lines).size).toBe(lines.length);
    for (const [index, line] of lines.entries()) {
      expect(line).not.toBeNull();
      const next = lines[index + 1];
      if (line && next) {
        expect(line.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
    }
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", start);
    expect(document.title).toBe("Provide the user details - Application Access Hub");

    await user.click(screen.getByRole("link", { name: "Change user type" }));

    await findHeading(headings.userType);
    expect(screen.getByRole("radio", { name: "Scottish Forestry" })).toBeChecked();
  });

  it("AC3: Previous goes back to the user type with the choice kept", async () => {
    const { user } = await openUserNumber("Scottish Forestry");

    await user.click(screen.getByRole("link", { name: "Previous" }));

    await findHeading(headings.userType);
    expect(screen.getByRole("radio", { name: "Scottish Forestry" })).toBeChecked();
  });

  it.each(["Scottish Government", "Scottish Forestry"])(
    "AC3: asks a %s user for a u, z or c number, with Cancel and Validate user details",
    async (userType) => {
      await openUserNumber(userType);

      expect(screen.getByRole("textbox", { name: "Enter user's u/z/c number" })).toHaveAccessibleDescription(numberHint);
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      expect(validateButton()).toBeInTheDocument();
    },
  );

  it("AC3: shows Validate user details as unavailable, and says why, until the number fits the format", async () => {
    const { user } = await openUserNumber();

    const button = validateButton();
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toBeEnabled();
    expect(button).toHaveAccessibleDescription("Enter a valid u, z or c number to continue");

    await user.type(userNumberField(), "u10000");
    expect(button).toHaveAttribute("aria-disabled", "true");

    await user.type(userNumberField(), "1");
    expect(button).not.toHaveAttribute("aria-disabled");
    expect(button).not.toHaveAccessibleDescription();

    await user.type(userNumberField(), "1");
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it.each(["x", "u1a", "u1234567"])(
    "AC3: says %s is in the wrong format while it is typed, without moving focus",
    async (value) => {
      const { user } = await openUserNumber();

      await user.type(userNumberField(), value);

      expect(userNumberField()).toHaveAccessibleDescription(`${numberHint} Error: ${numberError}`);
      expect(userNumberField()).toHaveFocus();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    },
  );

  it("AC3: waits until the field is left before saying an unfinished number is wrong", async () => {
    const { user } = await openUserNumber();

    await user.type(userNumberField(), "u12");
    expect(userNumberField()).toHaveAccessibleDescription(numberHint);

    await user.tab();
    expect(userNumberField()).toHaveAccessibleDescription(`${numberHint} Error: ${numberError}`);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each(["u100001", "U100001"])("AC3: accepts %s and moves on", async (value) => {
    const { user } = await openUserNumber();

    await user.type(userNumberField(), value);
    await user.click(validateButton());

    expect(await findHeading(headings.userDetails)).toBeInTheDocument();
  });

  it("AC3: asks for the number when the field is empty, and moves focus to the error summary", async () => {
    const { user } = await openUserNumber();

    await user.click(validateButton());

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole("link", { name: "Enter the user's u, z or c number" })).toHaveAttribute(
      "href",
      "#user-number",
    );
    expect(userNumberField()).toHaveAccessibleDescription(`${numberHint} Error: Enter the user's u, z or c number`);
    expect(document.title).toBe("Error: Provide the user details - Application Access Hub");
  });

  it("AC3: does not look the user up when the number is in the wrong format", async () => {
    const { user } = await openUserNumber();

    await user.type(userNumberField(), "999999");
    await user.click(validateButton());

    expect(within(screen.getByRole("alert")).getByRole("link", { name: numberError })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: headings.userIdentifier })).toBeInTheDocument();
  });

  it.each([
    ["Scottish Government", "U100001", "SG"],
    ["Scottish Forestry", "Z200002", "FGS"],
  ])("AC4: looks a %s user up with the backend's user type code", async (userType, userIdentifier, code) => {
    const lookedUp: string[] = [];
    server.use(
      http.get("*/users/:userIdentifier", ({ request }) => {
        lookedUp.push(new URL(request.url).search);
        return new HttpResponse(null, { status: 404 });
      }),
    );
    const { user } = await openUserNumber(userType);

    await user.type(userNumberField(), userIdentifier);
    await user.click(validateButton());

    await waitFor(() => expect(lookedUp).toEqual([`?userType=${code}`]));
  });

  it("AC4: says the user was not found and stays on the same step, until the number is changed", async () => {
    const { user } = await openUserNumber();

    await user.type(userNumberField(), "U999999");
    await user.click(validateButton());

    const summary = await screen.findByRole("alert");
    expect(within(summary).getByRole("link", { name: notFound })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: headings.userIdentifier })).toBeInTheDocument();
    expect(userNumberField()).toHaveValue("U999999");
    expect(userNumberField()).toHaveAccessibleDescription(`${numberHint} Error: ${notFound}`);

    await user.type(userNumberField(), "{Backspace}8");
    expect(userNumberField()).toHaveAccessibleDescription(numberHint);
  });

  it("AC4: does not find a user registered under a different user type", async () => {
    const { user } = await openUserNumber("Scottish Forestry");

    await user.type(userNumberField(), "U100001");
    await user.click(validateButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("User not found");
  });

  it("AC5: shows a checking state while the user is looked up", async () => {
    const { user } = await openUserNumber(undefined, "lookupSlow");

    await user.type(userNumberField(), "U100001");
    await user.click(validateButton());

    expect(await screen.findByRole("button", { name: "Validating" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Checking the user number");
  });

  it("AC5: shows a permission message on 403", async () => {
    const { user } = await openUserNumber(undefined, "lookupForbidden");

    await user.type(userNumberField(), "U100001");
    await user.click(validateButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You do not have permission to do this. Contact your administrator if you think this is wrong.",
    );
  });

  it("AC5: shows a plain-English message when the service fails", async () => {
    const { user } = await openUserNumber(undefined, "lookupServerError");

    await user.type(userNumberField(), "U100001");
    await user.click(validateButton());

    const summary = await screen.findByRole("alert");
    expect(summary).toHaveTextContent("Sorry, there is a problem with the service. Try again later.");
    expect(summary).not.toHaveTextContent("500");
  });

  it("AC5: shows a plain-English message when the network is down", async () => {
    const { user } = await openUserNumber(undefined, "lookupOffline");

    await user.type(userNumberField(), "U100001");
    await user.click(validateButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sorry, there is a problem with the service. Try again later.",
    );
  });

  it("AC3: sends you back to the start if no user type has been chosen", async () => {
    renderApp({ route: "/provision/user-number" });

    expect(await findHeading(headings.userType)).toBeInTheDocument();
  });

  it("AC3: has no accessibility violations, with and without errors", async () => {
    const { container, user } = await openUserNumber();
    await expectNoAxeViolations(container);

    await user.click(validateButton());
    await expectNoAxeViolations(container);
  });
});
