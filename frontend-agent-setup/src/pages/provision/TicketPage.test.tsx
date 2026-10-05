import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/node";
import type { ScenarioName } from "../../mocks/scenarios";
import type { ProvisioningRequest } from "../../services/provisioning";
import { expectNoAxeViolations } from "../../test/axe";
import { renderApp } from "../../test/render";
import { findHeading, headings, ticketLabel, walkToTicket } from "./testJourney";

const start = "/provision/user-type";

async function openTicket(scenario?: ScenarioName) {
  const rendered = renderApp({ route: start, scenario });
  await findHeading(headings.userType);
  await walkToTicket(rendered.user);
  return rendered;
}

describe("Add the JSM/Jira ticket ID", () => {
  it("AC10: shows everything from the previous step, including the chosen location", async () => {
    await openTicket();

    const summary = screen.getByRole("list", { name: "Request details" });
    for (const value of [
      "Government",
      "U100001",
      "Test environment",
      "Alex",
      "Example",
      "alex.example@example.test",
      "X000001",
      "Policy officer",
      "Perth",
    ]) {
      expect(summary).toHaveTextContent(value);
    }
  });

  it("AC10: only user type and user identifier can be changed; the user details are read-only", async () => {
    await openTicket();

    const summary = screen.getByRole("list", { name: "Request details" });
    expect(within(summary).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Change user type",
      "Change user identifier",
    ]);
  });

  it("AC10: has a JSM/Jira ticket field that explains the format, with Cancel and Submit", async () => {
    await openTicket();

    expect(screen.getByRole("textbox", { name: ticketLabel })).toHaveAccessibleDescription(
      "This must be ITS- followed by five digits, for example ITS-12345",
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  it("AC11: asks for the ticket ID when it is empty", async () => {
    const { user } = await openTicket();

    await user.click(screen.getByRole("button", { name: "Submit" }));

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole("link", { name: "Enter the JSM/Jira ticket ID" })).toHaveAttribute(
      "href",
      "#jira-ticket-id",
    );
  });

  it.each(["not a ticket", "ITS-1234", "ITS-123456", "ABC-12345"])(
    "AC11: rejects %s because it is not ITS- followed by five digits",
    async (value) => {
      const { user } = await openTicket();

      await user.type(screen.getByRole("textbox", { name: ticketLabel }), value);
      await user.click(screen.getByRole("button", { name: "Submit" }));

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Enter the JSM/Jira ticket ID in the correct format: ITS- followed by five digits, like ITS-12345",
      );
    },
  );

  it("AC12: submits the request and shows a green success ribbon with the transaction ID, separate from the ticket", async () => {
    let sent: unknown;
    server.use(
      http.post("*/provisioning-requests", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ transactionId: "TXN-000999" }, { status: 201 });
      }),
    );
    const { user } = await openTicket();

    await user.type(screen.getByRole("textbox", { name: ticketLabel }), "its-12345");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    const heading = await findHeading(headings.success);
    expect(heading.closest(".ds_notification")).toHaveClass("ds_notification--success");
    const result = screen.getByRole("list", { name: "Request reference" });
    expect(within(result).getByText("Transaction ID").closest("li")).toHaveTextContent("TXN-000999");
    expect(within(result).getByText("JSM/Jira ticket ID").closest("li")).toHaveTextContent("ITS-12345");
    const expected: ProvisioningRequest = {
      userType: "government",
      userIdentifier: "U100001",
      firstName: "Alex",
      surname: "Example",
      email: "alex.example@example.test",
      managerXNumber: "X000001",
      jobTitle: "Policy officer",
      location: "Perth",
      jiraTicketId: "ITS-12345",
    };
    expect(sent).toEqual(expected);
  });

  it("AC12: the success page offers a way back to the start", async () => {
    const { user } = await openTicket();
    await user.type(screen.getByRole("textbox", { name: ticketLabel }), "ITS-12345");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await findHeading(headings.success);

    await user.click(screen.getByRole("link", { name: "Return to the start" }));

    expect(await findHeading("Home")).toBeInTheDocument();
  });

  it("AC13: shows a red failure ribbon with a plain-English reason when submission fails", async () => {
    const { user } = await openTicket("submitServerError");

    await user.type(screen.getByRole("textbox", { name: ticketLabel }), "ITS-12345");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    const heading = await findHeading(headings.failed);
    expect(heading.closest(".ds_notification")).toHaveClass("app_notification--error");
    expect(screen.getByText("Sorry, there is a problem with the service. Try again later.")).toBeInTheDocument();
  });

  it("AC13: shows the permission reason on 403", async () => {
    const { user } = await openTicket("submitForbidden");

    await user.type(screen.getByRole("textbox", { name: ticketLabel }), "ITS-12345");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await findHeading(headings.failed);
    expect(screen.getByText(/You do not have permission to do this./)).toBeInTheDocument();
  });

  it("AC13: Try again returns to the ticket step with the answers kept", async () => {
    const { user } = await openTicket("submitServerError");
    await user.type(screen.getByRole("textbox", { name: ticketLabel }), "ITS-12345");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await findHeading(headings.failed);

    await user.click(screen.getByRole("link", { name: "Try again" }));

    await findHeading(headings.ticket);
    expect(screen.getByRole("list", { name: "Request details" })).toHaveTextContent("Perth");
    expect(screen.getByRole("textbox", { name: ticketLabel })).toHaveValue("ITS-12345");
  });

  it("AC12/AC13: the result pages have no accessibility violations", async () => {
    const { container, user } = await openTicket("submitServerError");
    await user.type(screen.getByRole("textbox", { name: ticketLabel }), "ITS-12345");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await findHeading(headings.failed);

    await expectNoAxeViolations(container);
  });

  it("AC10: has no accessibility violations, with and without errors", async () => {
    const { container, user } = await openTicket();
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole("button", { name: "Submit" }));
    await expectNoAxeViolations(container);
  });
});
