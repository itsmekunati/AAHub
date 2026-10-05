import { screen, waitFor } from "@testing-library/react";
import type { ScenarioName } from "../../mocks/scenarios";
import { renderApp } from "../../test/render";
import { captureUiEvents } from "../../test/uiEvents";
import { chooseUserType, findHeading, headings, ticketLabel, walkToTicket, walkToUserDetails } from "./testJourney";

const route = "/provision/user-type";

async function openJourney(scenario?: ScenarioName) {
  const events = captureUiEvents();
  const rendered = renderApp({ route, scenario });
  await findHeading(headings.userType);
  return { ...rendered, events };
}

describe("UI audit events in the provisioning journey", () => {
  it("reports that the journey started, once", async () => {
    const { events, user } = await openJourney();
    await chooseUserType(user);

    await waitFor(() => expect(events).toContainEqual({ eventType: "JOURNEY_STARTED", journey: "provisioning", step: "user-type" }));
    expect(events.filter((event) => event.eventType === "JOURNEY_STARTED")).toHaveLength(1);
  });

  it("reports the step the operator cancelled on", async () => {
    const { events, user } = await openJourney();
    await chooseUserType(user);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(events).toContainEqual({ eventType: "JOURNEY_CANCELLED", journey: "provisioning", step: "user-identifier" }),
    );
  });

  it("reports a client-side check that stopped the operator, naming the field but not its value", async () => {
    const { events, user } = await openJourney();
    await walkToTicket(user);

    await user.type(screen.getByRole("textbox", { name: ticketLabel }), "ABC-99999");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() =>
      expect(events).toContainEqual({
        eventType: "VALIDATION_BLOCKED",
        journey: "provisioning",
        step: "ticket",
        fields: ["jira-ticket-id"],
        userType: "government",
      }),
    );
    expect(JSON.stringify(events)).not.toContain("ABC-99999");
  });

  it("reports a missing location and a missing mandatory detail by name", async () => {
    const { events, user } = await openJourney();
    await walkToUserDetails(user, "Forestry", "Z200002");

    await user.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() =>
      expect(events).toContainEqual({
        eventType: "VALIDATION_BLOCKED",
        journey: "provisioning",
        step: "user-details",
        fields: ["jobTitle", "location"],
        userType: "forestry",
      }),
    );
  });

  it("reports a failure shown on screen with a reason code", async () => {
    const { events, user } = await openJourney("submitServerError");
    await walkToTicket(user);

    await user.type(screen.getByRole("textbox", { name: ticketLabel }), "ITS-12345");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await findHeading(headings.failed);

    await waitFor(() =>
      expect(events).toContainEqual({
        eventType: "SCREEN_ERROR",
        journey: "provisioning",
        step: "ticket",
        reasonCode: "HTTP_500",
        userType: "government",
      }),
    );
  });

  it("never sends personal data, the user identifier or the ticket", async () => {
    const { events, user } = await openJourney();
    await walkToTicket(user);
    await user.type(screen.getByRole("textbox", { name: ticketLabel }), "ITS-12345");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await findHeading(headings.success);

    await waitFor(() => expect(events.length).toBeGreaterThan(0));
    const sent = JSON.stringify(events);
    for (const value of ["Alex", "Example", "alex.example@example.test", "U100001", "X000001", "Policy officer", "ITS-12345"]) {
      expect(sent).not.toContain(value);
    }
  });

  it("carries on as normal when events cannot be reported", async () => {
    const { user } = renderApp({ route, scenario: "auditUnavailable" });
    await findHeading(headings.userType);

    await walkToTicket(user);
    await user.type(screen.getByRole("textbox", { name: ticketLabel }), "ITS-12345");
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(await findHeading(headings.success)).toBeInTheDocument();
  });
});
