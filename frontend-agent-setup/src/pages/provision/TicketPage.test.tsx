import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/node";
import type { ScenarioName } from "../../mocks/scenarios";
import type { ProvisioningRequest } from "../../services/provisioning";
import { expectNoAxeViolations } from "../../test/axe";
import { renderApp } from "../../test/render";
import {
  chooseUserType,
  completeUserDetails,
  findHeading,
  headings,
  ticketLabel,
  userNumberField,
  validateUserNumber,
  walkToTicket,
  walkToUserDetails,
} from "./testJourney";

const start = "/provision/user-type";
const ticketHint = "Enter just the numbers from the ITS ticket. This is required for audit purposes and is a mandatory field.";
const missingMessage = "You must enter the associated JSM ticket ID in order to submit this page.";
const formatMessage = "Enter the 6 numbers from the ITS ticket, for example 123456";

async function openTicket(scenario?: ScenarioName) {
  const rendered = renderApp({ route: start, scenario });
  await findHeading(headings.userType);
  await walkToTicket(rendered.user);
  return rendered;
}

const ticketField = () => screen.getByRole("textbox", { name: ticketLabel });
const submitButton = () => screen.getByRole("button", { name: "Submit" });
const requestDetails = () => screen.getByRole("list", { name: "Request details" });
const userDetails = () => screen.getByRole("list", { name: "User details" });

function row(list: HTMLElement, key: string) {
  return within(list).getByText(key, { selector: ".ds_summary-list__key" }).closest("li");
}

function captureRequest() {
  const captured: { sent?: unknown } = {};
  server.use(
    http.post("*/provisioning-requests", async ({ request }) => {
      captured.sent = await request.json();
      return HttpResponse.json({ transactionId: "TXN-000999" }, { status: 201 });
    }),
  );
  return captured;
}

describe("Review your selection before submitting: the JSM ticket step", () => {
  it("AC10: has the review heading at the smaller size, an introduction and a Previous link", async () => {
    await openTicket();

    expect(screen.getByRole("heading", { level: 1, name: headings.ticket })).toHaveClass("ds_h2");
    expect(screen.getByText("You are updating the details of an existing request.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/provision/user-details");
    await waitFor(() => expect(document.title).toBe("Review your selection before submitting - Application Access Hub"));
  });

  it("AC10: Previous goes back to the details step with the answers kept", async () => {
    const { user } = await openTicket();

    await user.click(screen.getByRole("link", { name: "Previous" }));

    expect(await screen.findByRole("textbox", { name: "Manager's x number" })).toBeInTheDocument();
    await screen.findByRole("option", { name: "Perth" });
    expect(screen.getByRole("combobox", { name: "Location" })).toHaveValue("Perth");
  });

  it("AC10: shows the environment, user type and user; only the last two can be changed", async () => {
    await openTicket();

    expect(row(requestDetails(), "Selected environment")).toHaveTextContent("Test environment");
    expect(row(requestDetails(), "Selected user type")).toHaveTextContent("Scottish Government");
    expect(row(requestDetails(), "Selected user")).toHaveTextContent("U100001");
    expect(within(requestDetails()).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Change selected user type",
      "Change selected user",
    ]);
  });

  it("AC10: shows the user's details, the manager's x number and the location, all read-only", async () => {
    await openTicket();

    expect(row(userDetails(), "First name")).toHaveTextContent("Alex");
    expect(row(userDetails(), "Last name")).toHaveTextContent("Example");
    expect(row(userDetails(), "Email address")).toHaveTextContent("alex.example@example.test");
    expect(row(userDetails(), "Job title")).toHaveTextContent("Policy officer");
    expect(row(userDetails(), "Manager's x number")).toHaveTextContent("dummy");
    expect(row(userDetails(), "Location")).toHaveTextContent("Perth");
    expect(within(userDetails()).queryByRole("link")).not.toBeInTheDocument();
  });

  it("AC10: has a JSM ticket section and field that explain what to enter, with Cancel and Submit", async () => {
    await openTicket();

    expect(screen.getByRole("heading", { level: 2, name: ticketLabel })).toBeInTheDocument();
    expect(ticketField()).toHaveAccessibleDescription(ticketHint);
    expect(ticketField()).toHaveAttribute("inputmode", "numeric");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(submitButton()).toBeInTheDocument();
  });

  it("AC11: shows Submit as unavailable, and says why, until the six numbers are entered", async () => {
    const { user } = await openTicket();

    expect(submitButton()).toHaveAttribute("aria-disabled", "true");
    expect(submitButton()).toBeEnabled();
    expect(submitButton()).toHaveAccessibleDescription("Enter the 6 numbers from the ITS ticket to continue");

    await user.type(ticketField(), "12345");
    expect(submitButton()).toHaveAttribute("aria-disabled", "true");

    await user.type(ticketField(), "6");
    expect(submitButton()).not.toHaveAttribute("aria-disabled");
    expect(submitButton()).not.toHaveAccessibleDescription();

    await user.type(ticketField(), "7");
    expect(submitButton()).toHaveAttribute("aria-disabled", "true");
  });

  it.each(["12a", "ABC", "1234567"])(
    "AC11: says %s is not the six numbers while it is typed, without moving focus",
    async (value) => {
      const { user } = await openTicket();

      await user.type(ticketField(), value);

      expect(ticketField()).toHaveAccessibleDescription(`${ticketHint} Error: ${formatMessage}`);
      expect(ticketField()).toHaveFocus();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    },
  );

  it("AC11: waits until the field is left before saying there are too few numbers", async () => {
    const { user } = await openTicket();

    await user.type(ticketField(), "123");
    expect(ticketField()).toHaveAccessibleDescription(ticketHint);

    await user.tab();
    expect(ticketField()).toHaveAccessibleDescription(`${ticketHint} Error: ${formatMessage}`);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("AC11: asks for the ticket ID when it is empty, and moves focus to the error summary", async () => {
    const { user } = await openTicket();

    await user.click(submitButton());

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole("link", { name: missingMessage })).toHaveAttribute("href", "#jira-ticket-id");
    expect(ticketField()).toHaveAccessibleDescription(`${ticketHint} Error: ${missingMessage}`);
  });

  it.each(["not a ticket", "ITS-12345", "ITS-1234567", "ABC-123456", "12345"])(
    "AC11: will not submit %s because it is not the six numbers from the ITS ticket",
    async (value) => {
      const captured = captureRequest();
      const { user } = await openTicket();

      await user.type(ticketField(), value);
      await user.click(submitButton());

      expect(within(screen.getByRole("alert")).getByRole("link", { name: formatMessage })).toBeInTheDocument();
      expect(ticketField()).toBeInTheDocument();
      expect(captured.sent).toBeUndefined();
    },
  );

  it("AC11: accepts just the six digits and sends ITS- with them", async () => {
    const captured = captureRequest();
    const { user } = await openTicket();

    await user.type(ticketField(), "123456");
    await user.click(submitButton());

    await findHeading(headings.success);
    expect(captured.sent).toEqual(expect.objectContaining({ jiraTicketId: "ITS-123456" }));
  });

  it("AC12: submits the request, with the dummy manager's x number when none was typed, and shows a green success ribbon", async () => {
    const captured = captureRequest();
    const { user } = await openTicket();

    await user.type(ticketField(), "its-123456");
    await user.click(submitButton());

    const heading = await findHeading(headings.success);
    expect(heading.closest(".ds_notification")).toHaveClass("ds_notification--success");
    expect(heading.closest(".ds_layout")).toHaveClass("ds_layout--category-list");
    const expected: ProvisioningRequest = {
      userType: "SG",
      userIdentifier: "U100001",
      firstName: "Alex",
      surname: "Example",
      email: "alex.example@example.test",
      managerXNumber: "dummy",
      jobTitle: "Policy officer",
      location: "Perth",
      jiraTicketId: "ITS-123456",
    };
    expect(captured.sent).toEqual(expected);
  });

  it("AC12: shows and sends the manager's x number the operator typed", async () => {
    const captured = captureRequest();
    const { user } = renderApp({ route: start });
    await findHeading(headings.userType);
    await walkToUserDetails(user);
    await user.type(screen.getByRole("textbox", { name: "Manager's x number" }), " X654321 ");
    await completeUserDetails(user);
    expect(row(userDetails(), "Manager's x number")).toHaveTextContent("X654321");

    await user.type(ticketField(), "123456");
    await user.click(submitButton());

    await findHeading(headings.success);
    expect(captured.sent).toEqual(expect.objectContaining({ managerXNumber: "X654321" }));
  });

  it("AC12: shows a submitting state and cannot be submitted twice", async () => {
    let requests = 0;
    server.use(
      http.post("*/provisioning-requests", async () => {
        requests += 1;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({ transactionId: "TXN-000999" }, { status: 201 });
      }),
    );
    const { user } = await openTicket();
    await user.type(ticketField(), "123456");

    await user.click(submitButton());

    expect(await screen.findByRole("button", { name: "Submitting" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Submitting the request");
    await findHeading(headings.success);
    expect(requests).toBe(1);
  });

  it("AC12: the success page says who was provisioned and where, their new x number, and what to do next", async () => {
    const { user } = await openTicket();
    await user.type(ticketField(), "123456");
    await user.click(submitButton());
    await findHeading(headings.success);

    expect(screen.getByText(/has been provisioned successfully/)).toHaveTextContent(
      "The Scottish Government user Alex Example in the Test environment environment has been provisioned successfully.",
    );
    for (const emphasised of ["Scottish Government", "Alex Example", "Test environment"]) {
      expect(screen.getByText(emphasised, { selector: "strong" })).toBeInTheDocument();
    }
    expect(screen.getByText("User's x number for Test environment environment is x500001.")).toBeInTheDocument();
    expect(screen.getByText("Please update any corresponding JSM tickets.")).toBeInTheDocument();
  });

  it("AC12: the success page does not show the transaction ID or the ticket", async () => {
    const { user } = await openTicket();
    await user.type(ticketField(), "123456");
    await user.click(submitButton());
    await findHeading(headings.success);

    const main = screen.getByRole("main");
    expect(main).not.toHaveTextContent("TXN-000123");
    expect(main).not.toHaveTextContent("Transaction ID");
    expect(main).not.toHaveTextContent("ITS-123456");
    expect(within(main).queryByRole("list")).not.toBeInTheDocument();
  });

  it("AC12: leaves the x number sentence out when the backend does not return one", async () => {
    captureRequest();
    const { user } = await openTicket();
    await user.type(ticketField(), "123456");
    await user.click(submitButton());
    await findHeading(headings.success);

    expect(screen.getByText(/has been provisioned successfully/)).toBeInTheDocument();
    expect(screen.queryByText(/User's x number/)).not.toBeInTheDocument();
  });

  it("AC12: the success page offers a way back to the home page", async () => {
    const { user } = await openTicket();
    await user.type(ticketField(), "123456");
    await user.click(submitButton());
    await findHeading(headings.success);

    await user.click(screen.getByRole("link", { name: "Go to Home Page" }));

    expect(await findHeading("Home")).toBeInTheDocument();
  });

  it.each([
    ["submitServerError", "Sorry, there is a problem with the service. Try again later."],
    ["submitForbidden", "You do not have permission to do this. Contact your administrator if you think this is wrong."],
    ["submitOffline", "Sorry, there is a problem with the service. Try again later."],
  ] as const)("AC13: shows a red failure ribbon and the failure details for %s", async (scenario, reason) => {
    const { user } = await openTicket(scenario);

    await user.type(ticketField(), "123456");
    await user.click(submitButton());

    const heading = await findHeading(headings.failed);
    expect(heading.closest(".ds_notification")).toHaveClass("app_notification--error");
    expect(heading.closest(".ds_layout")).toHaveClass("ds_layout--category-list");
    const details = screen.getByRole("heading", { level: 2, name: "Provisioning failure details" }).closest("div");
    expect(details).toHaveClass("app_failure-details");
    expect(within(details as HTMLElement).getByText(/has not been provisioned/)).toHaveTextContent(
      "The Scottish Government user Alex Example in the Test environment environment has not been provisioned.",
    );
    expect(details).toHaveTextContent(`Provisioning failure details: ${reason}`);
    expect(details).toHaveTextContent("Please update any corresponding JSM tickets and escalate to the relevant team.");
  });

  it("AC13: the failure page offers only a way back to the home page", async () => {
    const { user } = await openTicket("submitServerError");
    await user.type(ticketField(), "123456");
    await user.click(submitButton());
    await findHeading(headings.failed);

    expect(screen.queryByRole("link", { name: "Try again" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Go to Home Page" }));

    expect(await findHeading("Home")).toBeInTheDocument();
  });

  it.each([
    ["success", "success"],
    ["submitServerError", "failed"],
  ] as const)(
    "AC14: after the %s result, Back starts again with none of the answers kept",
    async (scenario, result) => {
      const rendered = renderApp({ route: start, scenario });
      const { user, goBack } = rendered;
      await findHeading(headings.userType);
      await walkToUserDetails(user);
      await user.type(screen.getByRole("textbox", { name: "Manager's x number" }), "x654321");
      await completeUserDetails(user);
      await user.type(ticketField(), "123456");
      await user.click(submitButton());
      await findHeading(headings[result]);

      goBack();

      await findHeading(headings.userType);
      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).not.toBeChecked();
      }
      const main = screen.getByRole("main");
      for (const answer of ["U100001", "Alex", "Example", "x654321", "Perth", "123456"]) {
        expect(main).not.toHaveTextContent(answer);
      }

      await chooseUserType(user);
      expect(userNumberField()).toHaveValue("");
      await validateUserNumber(user);
      expect(screen.getByRole("textbox", { name: "Manager's x number" })).toHaveValue("");
      await screen.findByRole("option", { name: "Perth" });
      expect(screen.getByRole("combobox", { name: "Location" })).toHaveValue("");
      await completeUserDetails(user);
      expect(ticketField()).toHaveValue("");
    },
  );

  it("AC14: after a result, pressing Back again still cannot show the old answers", async () => {
    const { user, goBack } = await openTicket();
    await user.type(ticketField(), "123456");
    await user.click(submitButton());
    await findHeading(headings.success);

    goBack();
    await findHeading(headings.userType);
    goBack();

    await findHeading(headings.userType);
    expect(screen.getByRole("main")).not.toHaveTextContent("U100001");
  });

  it("AC12/AC13: the result pages have no accessibility violations", async () => {
    const { container, user } = await openTicket("submitServerError");
    await user.type(ticketField(), "123456");
    await user.click(submitButton());
    await findHeading(headings.failed);

    await expectNoAxeViolations(container);
  });

  it("AC10: has no accessibility violations, with and without errors", async () => {
    const { container, user } = await openTicket();
    await expectNoAxeViolations(container);

    await user.click(submitButton());
    await expectNoAxeViolations(container);
  });
});
