import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/node";
import type { ScenarioName } from "../../mocks/scenarios";
import { expectNoAxeViolations } from "../../test/axe";
import { renderApp } from "../../test/render";
import { testConfig } from "../../test/testConfig";
import { natureScotCsvMessages } from "./natureScotCsv";
import {
  chooseUserType,
  findHeading,
  headings,
  natureScotCsv,
  natureScotField,
  pasteInto,
  pasteNatureScotInformation,
} from "./testJourney";

const start = "/provision/user-type";
const hint = "Paste in the user information in csv format";
const existingUser = natureScotCsv({ userIdentifier: "GAKWO400004", email: "kim.existing@example.test" });
const alreadyExists = `The user already exists in ${testConfig.environmentName}, x number is x400004`;

async function openNatureScot(scenario?: ScenarioName) {
  const rendered = renderApp({ route: start, scenario });
  await findHeading(headings.userType);
  await chooseUserType(rendered.user, "NatureScot");
  return rendered;
}

const nextButton = () => screen.getByRole("button", { name: "Next" });

describe("Enter NatureScot user information", () => {
  it("AC1: replaces the GAKWO number step for NatureScot, under the selected user type", async () => {
    await openNatureScot();

    const heading = screen.getByRole("heading", { level: 1, name: headings.natureScotInformation });
    expect(heading).toHaveClass("ds_h2");
    expect(document.title).toBe("Enter NatureScot user information - Application Access Hub");
    expect(screen.getByText("Selected user type:")).toBeInTheDocument();
    expect(screen.getByText("NatureScot")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Change user type" })).toHaveAttribute("href", start);
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", start);
    expect(natureScotField()).toHaveAccessibleDescription(hint);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /GAKWO/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Validate user details" })).not.toBeInTheDocument();
  });

  it("AC2: shows Next as unavailable, and says why, until the pasted information is valid", async () => {
    const { user } = await openNatureScot();

    expect(nextButton()).toHaveAttribute("aria-disabled", "true");
    expect(nextButton()).toBeEnabled();
    expect(nextButton()).toHaveAccessibleDescription("Paste in valid NatureScot user information to continue");

    await pasteInto(user, natureScotCsv({ userIdentifier: "XXXX" }));
    expect(nextButton()).toHaveAttribute("aria-disabled", "true");

    await pasteInto(user, natureScotCsv());
    expect(nextButton()).not.toHaveAttribute("aria-disabled");
    expect(nextButton()).not.toHaveAccessibleDescription();
  });

  it("AC2: says at once when there are too many values, without moving focus", async () => {
    const { user } = await openNatureScot();

    await pasteInto(user, `${natureScotCsv()} extra`);

    expect(natureScotField()).toHaveAccessibleDescription(`${hint} Error: ${natureScotCsvMessages.columns}`);
    expect(natureScotField()).toHaveFocus();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("AC2: waits until the field is left before saying an unfinished line is wrong", async () => {
    const { user } = await openNatureScot();

    await pasteInto(user, "Jo, Test");
    expect(natureScotField()).toHaveAccessibleDescription(hint);

    await user.tab();
    expect(natureScotField()).toHaveAccessibleDescription(`${hint} Error: ${natureScotCsvMessages.columns}`);
  });

  it("AC2: asks for the information when Next is pressed with nothing pasted, and moves focus to the error summary", async () => {
    const { user } = await openNatureScot();

    await user.click(nextButton());

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole("link", { name: natureScotCsvMessages.missing })).toHaveAttribute(
      "href",
      "#user-information",
    );
    expect(document.title).toBe("Error: Enter NatureScot user information - Application Access Hub");
  });

  it("AC2: says which value is wrong, and does not ask the backend", async () => {
    const checked: string[] = [];
    server.use(
      http.get("*/existing-users", ({ request }) => {
        checked.push(request.url);
        return new HttpResponse(null, { status: 404 });
      }),
    );
    const { user } = await openNatureScot();

    await pasteInto(user, natureScotCsv({ email: "not-an-email" }));
    await user.click(nextButton());

    expect(
      within(screen.getByRole("alert")).getByRole("link", { name: natureScotCsvMessages.email }),
    ).toBeInTheDocument();
    expect(checked).toEqual([]);
  });

  it("AC3: asks the backend whether the user already exists, with the GAKWO number and email address", async () => {
    const checked: URLSearchParams[] = [];
    server.use(
      http.get("*/existing-users", ({ request }) => {
        checked.push(new URL(request.url).searchParams);
        return new HttpResponse(null, { status: 404 });
      }),
    );
    const { user } = await openNatureScot();

    await pasteNatureScotInformation(user);

    expect(checked).toHaveLength(1);
    expect(Object.fromEntries(checked[0] ?? [])).toEqual({
      userType: "SNH",
      userIdentifier: "GAKWO300003",
      email: "jo.test@example.test",
    });
  });

  it("AC3: says the user already exists, with the environment and their x number, and stays on the step", async () => {
    const { user } = await openNatureScot();

    await pasteInto(user, existingUser);
    await user.click(nextButton());

    const summary = await screen.findByRole("alert");
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole("link", { name: alreadyExists })).toHaveAttribute("href", "#user-information");
    expect(natureScotField()).toHaveAccessibleDescription(`${hint} Error: ${alreadyExists}`);
    expect(screen.getByRole("heading", { level: 1, name: headings.natureScotInformation })).toBeInTheDocument();

    await user.type(natureScotField(), " ");
    expect(natureScotField()).toHaveAccessibleDescription(hint);
  });

  it("AC4: moves on to the review step when the user does not exist yet", async () => {
    const { user } = await openNatureScot();

    await pasteNatureScotInformation(user);

    expect(screen.getByRole("heading", { level: 1, name: headings.userDetails })).toBeInTheDocument();
  });

  it("AC4: Previous on the review step brings back what was pasted", async () => {
    const { user } = await openNatureScot();
    await pasteNatureScotInformation(user);

    await user.click(screen.getByRole("link", { name: "Previous" }));

    await findHeading(headings.natureScotInformation);
    expect(natureScotField()).toHaveValue(natureScotCsv());
  });

  it("AC5: shows a checking state while the backend is asked", async () => {
    const { user } = await openNatureScot("existingCheckSlow");

    await pasteInto(user, natureScotCsv());
    await user.click(nextButton());

    expect(await screen.findByRole("button", { name: "Checking" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Checking whether the user already exists");
  });

  it.each<[ScenarioName, string]>([
    [
      "existingCheckForbidden",
      "You do not have permission to do this. Contact your administrator if you think this is wrong.",
    ],
    ["existingCheckServerError", "Sorry, there is a problem with the service. Try again later."],
    ["existingCheckOffline", "Sorry, there is a problem with the service. Try again later."],
  ])("AC5: shows a plain-English message under %s", async (scenario, message) => {
    const { user } = await openNatureScot(scenario);

    await pasteInto(user, natureScotCsv());
    await user.click(nextButton());

    const summary = await screen.findByRole("alert");
    expect(summary).toHaveTextContent(message);
    expect(summary).not.toHaveTextContent(/403|500/);
  });

  it("AC1: has no accessibility violations, with and without errors", async () => {
    const { container, user } = await openNatureScot();
    await expectNoAxeViolations(container);

    await pasteInto(user, existingUser);
    await user.click(nextButton());
    await screen.findByRole("alert");
    await waitFor(() => expect(natureScotField()).toHaveAttribute("aria-invalid", "true"));
    await expectNoAxeViolations(container);
  });
});
