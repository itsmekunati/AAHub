import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, useNavigate } from "react-router";
import { AppRoutes } from "../../AppRoutes";
import { server } from "../../mocks/node";
import type { ScenarioName } from "../../mocks/scenarios";
import { expectNoAxeViolations } from "../../test/axe";
import { renderApp } from "../../test/render";
import { testConfig } from "../../test/testConfig";
import { captureUiEvents } from "../../test/uiEvents";
import { findHeading, headings, reviewLabel, start, walkToSelectGroups } from "./testJourney";

const ticketLabel = "Enter the JSM ticket ID associated with this request";
const ticketHint =
  "Enter just the numbers from the ITS ticket. This is required for audit purposes and is a mandatory field.";
const missingMessage = "You must enter the associated JSM ticket ID in order to submit this page.";
const formatMessage = "Enter the 6 numbers from the ITS ticket, for example 123456";
const submitName = "Submit";
const leadText = "Review the group selection, before clicking Submit to make the changes.";

function summaryRow(key: string) {
  const row = screen.getByText(key).closest("li");
  if (!row) {
    throw new Error(`No summary row for ${key}`);
  }
  return row;
}

/** The answers on a row, one per line, without the Change link's own list item. */
function answers(key: string): string[] {
  const value = summaryRow(key).querySelector(".ds_summary-list__value");
  if (!(value instanceof HTMLElement)) {
    throw new Error(`No answer for ${key}`);
  }
  const lines = within(value).queryAllByRole("listitem");
  return lines.length > 0 ? lines.map((line) => line.textContent ?? "") : [value.textContent ?? ""];
}

function ticketField() {
  return screen.getByRole("textbox", { name: ticketLabel });
}

/** Swaps RegisteredUser for TransactionalCustomer, then presses Review. */
async function openReview(scenario?: ScenarioName) {
  const rendered = renderApp({ route: start, scenario });
  await walkToSelectGroups(rendered.user);
  await rendered.user.click(screen.getByRole("checkbox", { name: "RPS - RegisteredUser" }));
  await rendered.user.click(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }));
  await rendered.user.click(screen.getByRole("button", { name: reviewLabel }));
  await findHeading(headings.reviewChanges);
  return rendered;
}

describe("Review your selection before submitting", () => {
  it("AC11: shows the lead text, the environment, the user and the groups to add and remove, one per line", async () => {
    const { user } = renderApp({ route: start });
    await walkToSelectGroups(user);
    await user.click(screen.getByRole("checkbox", { name: "RPS - RegisteredUser" }));
    await user.click(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }));
    await user.click(screen.getByRole("tab", { name: "LPIS" }));
    await user.click(screen.getByRole("checkbox", { name: "LPIS - Example group A" }));
    await user.click(screen.getByRole("button", { name: reviewLabel }));
    await findHeading(headings.reviewChanges);

    expect(screen.getByText(leadText)).toBeInTheDocument();
    expect(summaryRow("Environment")).toHaveTextContent(testConfig.environmentName);
    expect(summaryRow("User details")).toHaveTextContent("x123456");
    expect(answers("User added to the following LDAP groups")).toEqual([
      "RPS - TransactionalCustomer",
      "LPIS - Example group A",
    ]);
    expect(answers("User removed from the following LDAP groups")).toEqual(["RPS - RegisteredUser"]);
  });

  it("AC11: says None when nothing is removed", async () => {
    const { user } = renderApp({ route: start });
    await walkToSelectGroups(user);
    await user.click(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }));
    await user.click(screen.getByRole("button", { name: reviewLabel }));
    await findHeading(headings.reviewChanges);

    expect(summaryRow("User removed from the following LDAP groups")).toHaveTextContent("None");
  });

  it("AC11: the environment cannot be changed; every other row can, and goes to the right step", async () => {
    const { user } = await openReview();

    expect(within(summaryRow("Environment")).queryByRole("link")).not.toBeInTheDocument();

    await user.click(within(summaryRow("User details")).getByRole("link", { name: /^Change/ }));
    expect(await findHeading(headings.userDetails)).toBeInTheDocument();
  });

  it("AC11: Change on a group row goes back with the ticks kept", async () => {
    const { user } = await openReview();

    await user.click(
      within(summaryRow("User added to the following LDAP groups")).getByRole("link", { name: /^Change/ }),
    );

    await findHeading(headings.selectGroups);
    expect(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "RPS - RegisteredUser" })).not.toBeChecked();
  });

  it("AC11: Previous goes back to the group selection", async () => {
    const { user } = await openReview();

    await user.click(screen.getByRole("link", { name: "Previous" }));

    expect(await findHeading(headings.selectGroups)).toBeInTheDocument();
  });

  it("AC11: sends you back to the user details if there is nothing to review", async () => {
    renderApp({ route: "/role-manager/review-changes" });

    expect(await findHeading(headings.userDetails)).toBeInTheDocument();
  });

  it("AC13: asks for the ticket with its hint, and Submit is unavailable until the ticket is valid", async () => {
    const { user } = await openReview();

    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("ds_h2");
    expect(screen.getByRole("heading", { level: 2, name: ticketLabel })).not.toHaveClass("ds_h3");
    expect(ticketField()).toHaveAccessibleDescription(ticketHint);
    const submit = screen.getByRole("button", { name: submitName });
    expect(submit).toHaveAttribute("aria-disabled", "true");
    expect(submit).toHaveAccessibleDescription("Enter the 6 numbers from the ITS ticket to continue");

    await user.type(ticketField(), "123456");

    expect(screen.getByRole("button", { name: submitName })).not.toHaveAttribute("aria-disabled");
  });

  it("AC13: pressing the unavailable Submit shows the missing message and moves focus to the summary", async () => {
    const events = captureUiEvents();
    const { user } = await openReview();

    await user.click(screen.getByRole("button", { name: submitName }));

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole("link", { name: missingMessage })).toHaveAttribute("href", "#jsm-ticket-id");
    expect(ticketField()).toHaveAccessibleDescription(`${ticketHint} Error: ${missingMessage}`);
    await waitFor(() =>
      expect(events).toContainEqual({
        eventType: "VALIDATION_BLOCKED",
        journey: "role-management",
        step: "review-changes",
        fields: ["jsm-ticket-id"],
        userType: "SG",
      }),
    );
  });

  it("AC13: shows a wrong-format error while typing, but waits when there are too few digits", async () => {
    const { user } = await openReview();

    await user.type(ticketField(), "123");
    expect(screen.queryByText(formatMessage)).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByText(formatMessage)).toBeInTheDocument();

    await user.clear(ticketField());
    await user.type(ticketField(), "12a");
    expect(screen.getByText(formatMessage)).toBeInTheDocument();
  });

  it("AC13: the summary link moves focus to the ticket field", async () => {
    const { user } = await openReview();
    await user.click(screen.getByRole("button", { name: submitName }));

    await user.click(within(screen.getByRole("alert")).getByRole("link", { name: missingMessage }));

    expect(ticketField()).toHaveFocus();
  });

  it("AC14: submits the groups to add and remove with the canonical ticket, then shows the transaction ID separately", async () => {
    let sent: unknown;
    server.use(
      http.post("*/role-change-requests", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ transactionId: "TXN-000999" }, { status: 201 });
      }),
    );
    const { user } = await openReview();

    await user.type(ticketField(), "123456");
    await user.click(screen.getByRole("button", { name: submitName }));

    const heading = await findHeading("Change success");
    expect(heading.closest(".ds_notification")).toHaveClass("ds_notification--success");
    expect(sent).toEqual({
      userType: "SG",
      userIdentifier: "x123456",
      groupsToAdd: ["RPS-TransactionalCustomer"],
      groupsToRemove: ["RPS-RegisteredUser"],
      jiraTicketId: "ITS-123456",
    });
    const result = screen.getByRole("list", { name: "Request reference" });
    expect(within(result).getByText("Transaction ID").closest("li")).toHaveTextContent("TXN-000999");
    expect(within(result).getByText("JSM ticket ID").closest("li")).toHaveTextContent("ITS-123456");
  });

  it("AC14: a pasted ITS-123456 is sent as ITS-123456", async () => {
    let sent: unknown;
    server.use(
      http.post("*/role-change-requests", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ transactionId: "TXN-000999" }, { status: 201 });
      }),
    );
    const { user } = await openReview();

    await user.type(ticketField(), "its-123456");
    await user.click(screen.getByRole("button", { name: submitName }));

    await findHeading("Change success");
    expect(sent).toEqual(expect.objectContaining({ jiraTicketId: "ITS-123456" }));
  });

  it("AC14: shows a busy Submit while the request is in flight, so it cannot be sent twice", async () => {
    let requests = 0;
    server.use(
      http.post("*/role-change-requests", async () => {
        requests += 1;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ transactionId: "TXN-000999" }, { status: 201 });
      }),
    );
    const { user } = await openReview();
    await user.type(ticketField(), "123456");

    await user.click(screen.getByRole("button", { name: submitName }));

    expect(screen.getByRole("button", { name: "Submitting" })).toBeDisabled();
    await findHeading("Change success");
    expect(requests).toBe(1);
  });

  it("AC14: a server error opens the failure page and reports it by code", async () => {
    const events = captureUiEvents();
    const { user } = await openReview("roleChangeServerError");
    await user.type(ticketField(), "123456");

    await user.click(screen.getByRole("button", { name: submitName }));

    expect(await findHeading("Change failure")).toBeInTheDocument();
    expect(
      screen.getByText("Please update any corresponding JSM tickets and escalate to the relevant team."),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(events).toContainEqual({
        eventType: "SCREEN_ERROR",
        journey: "role-management",
        step: "review-changes",
        reasonCode: "HTTP_500",
        userType: "SG",
      }),
    );
  });

  it("AC14: shows the permission message on 403", async () => {
    const { user } = await openReview("roleChangeForbidden");
    await user.type(ticketField(), "123456");

    await user.click(screen.getByRole("button", { name: submitName }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/You do not have permission to do this./);
  });

  it("AC14: going back to the review page after submitting cannot submit twice", async () => {
    let requests = 0;
    server.use(
      http.post("*/role-change-requests", () => {
        requests += 1;
        return HttpResponse.json({ transactionId: "TXN-000999" }, { status: 201 });
      }),
    );
    function BrowserBack() {
      const navigate = useNavigate();
      return <button onClick={() => void navigate(-1)}>Browser back</button>;
    }
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={[start]}>
        <BrowserBack />
        <AppRoutes />
      </MemoryRouter>,
    );
    await walkToSelectGroups(user);
    await user.click(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }));
    await user.click(screen.getByRole("button", { name: reviewLabel }));
    await findHeading(headings.reviewChanges);
    await user.type(ticketField(), "123456");
    await user.click(screen.getByRole("button", { name: submitName }));
    await findHeading("Change success");

    await user.click(screen.getByRole("button", { name: "Browser back" }));

    expect(await findHeading("Change success")).toBeInTheDocument();
    expect(requests).toBe(1);
  });

  it("AC14: the submitted page offers a way back to the start", async () => {
    const { user } = await openReview();
    await user.type(ticketField(), "123456");
    await user.click(screen.getByRole("button", { name: submitName }));
    await findHeading("Change success");

    await user.click(screen.getByRole("link", { name: "Go to Home Page" }));

    expect(await findHeading("Home")).toBeInTheDocument();
  });

  it("AC14: sends you to the start of the journey if the submitted page is opened with nothing submitted", async () => {
    renderApp({ route: "/role-manager/submitted" });

    expect(await findHeading(headings.userDetails)).toBeInTheDocument();
  });

  it("AC13: never reports the ticket, user or group names in an audit event", async () => {
    const events = captureUiEvents();
    const { user } = await openReview("roleChangeServerError");
    await user.type(ticketField(), "123456");
    await user.click(screen.getByRole("button", { name: submitName }));
    await findHeading("Change failure");

    await waitFor(() => expect(events.some((event) => event.eventType === "SCREEN_ERROR")).toBe(true));
    const sent = JSON.stringify(events);
    for (const value of ["123456", "x123456", "RPS-"]) {
      expect(sent).not.toContain(value);
    }
  });

  it("AC13: Cancel is reported with the step", async () => {
    const events = captureUiEvents();
    const { user } = await openReview();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await findHeading("Home")).toBeInTheDocument();
    await waitFor(() =>
      expect(events).toContainEqual({
        eventType: "JOURNEY_CANCELLED",
        journey: "role-management",
        step: "review-changes",
      }),
    );
  });

  it("AC11/AC13/AC14: has no accessibility violations, with and without errors, and on the submitted page", async () => {
    const { container, user } = await openReview();
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole("button", { name: submitName }));
    await screen.findByRole("alert");
    await expectNoAxeViolations(container);

    await user.type(ticketField(), "123456");
    await user.click(screen.getByRole("button", { name: submitName }));
    await findHeading("Change success");
    await expectNoAxeViolations(container);
  });
});
