import { screen, waitFor } from "@testing-library/react";
import type { ScenarioName } from "../../mocks/scenarios";
import { renderApp } from "../../test/render";
import { captureUiEvents } from "../../test/uiEvents";
import { findHeading, headings, start, submitIdentifier } from "./testJourney";

const journey = "role-management";

async function openJourney(scenario?: ScenarioName) {
  const events = captureUiEvents();
  const rendered = renderApp({ route: start, scenario });
  await findHeading(headings.userDetails);
  return { ...rendered, events };
}

describe("UI audit events in the User Role Manager journey", () => {
  it("AC7: reports that the journey started, once", async () => {
    const { events } = await openJourney();

    await waitFor(() => expect(events).toContainEqual({ eventType: "JOURNEY_STARTED", journey, step: "user-details" }));
    expect(events.filter((event) => event.eventType === "JOURNEY_STARTED")).toHaveLength(1);
  });

  it("AC7: reports Cancel", async () => {
    const { events, user } = await openJourney();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(events).toContainEqual({ eventType: "JOURNEY_CANCELLED", journey, step: "user-details" }),
    );
  });

  it("AC7: reports a client-side check by field name, never the value", async () => {
    const { events, user } = await openJourney();

    await submitIdentifier(user, "ab!c");

    await waitFor(() =>
      expect(events).toContainEqual({
        eventType: "VALIDATION_BLOCKED",
        journey,
        step: "user-details",
        fields: ["user-identifier"],
        userType: "SG",
      }),
    );
    expect(JSON.stringify(events)).not.toContain("ab!c");
  });

  it("AC7: reports a failure shown on screen with a reason code", async () => {
    const { events, user } = await openJourney("ldapGroupsServerError");

    await submitIdentifier(user, "x123456");
    await screen.findByRole("alert");

    await waitFor(() =>
      expect(events).toContainEqual({
        eventType: "SCREEN_ERROR",
        journey,
        step: "user-details",
        reasonCode: "HTTP_500",
        userType: "SG",
      }),
    );
    expect(JSON.stringify(events)).not.toContain("x123456");
  });

  it("AC7: never sends the identifier or group names", async () => {
    const { events, user } = await openJourney();

    await submitIdentifier(user, "x123456");
    await findHeading(headings.selectGroups);

    await waitFor(() => expect(events.length).toBeGreaterThan(0));
    const sent = JSON.stringify(events);
    for (const value of ["x123456", "RPS-Example"]) {
      expect(sent).not.toContain(value);
    }
  });

  it("AC10: reports a broken group rule by application, never the user or group names", async () => {
    const { events, user } = await openJourney();
    await submitIdentifier(user, "jo.bloggs", "public");
    await findHeading(headings.selectGroups);

    await user.click(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }));
    await user.click(screen.getByRole("button", { name: "Review" }));

    await waitFor(() =>
      expect(events).toContainEqual({
        eventType: "VALIDATION_BLOCKED",
        journey,
        step: "select-groups",
        fields: ["rps-groups"],
        userType: "public",
      }),
    );
    const sent = JSON.stringify(events);
    for (const value of ["jo.bloggs", "RPS - ", "RPS-"]) {
      expect(sent).not.toContain(value);
    }
  });

  it("AC7: carries on as normal when events cannot be reported", async () => {
    const { user } = renderApp({ route: start, scenario: "auditUnavailable" });
    await findHeading(headings.userDetails);

    await submitIdentifier(user, "x123456");

    expect(await findHeading(headings.selectGroups)).toBeInTheDocument();
  });
});
