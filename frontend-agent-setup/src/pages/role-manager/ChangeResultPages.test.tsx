import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/node";
import type { ScenarioName } from "../../mocks/scenarios";
import { expectNoAxeViolations } from "../../test/axe";
import { renderApp } from "../../test/render";
import { testConfig } from "../../test/testConfig";
import { captureUiEvents } from "../../test/uiEvents";
import { findHeading, headings, reviewLabel, start, walkToSelectGroups } from "./testJourney";

/** Swaps RegisteredUser for TransactionalCustomer, enters the ticket and presses Submit. */
async function submitChange(scenario?: ScenarioName) {
  const rendered = renderApp({ route: start, scenario });
  await walkToSelectGroups(rendered.user);
  await rendered.user.click(screen.getByRole("checkbox", { name: "RPS - RegisteredUser" }));
  await rendered.user.click(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }));
  await rendered.user.click(screen.getByRole("button", { name: reviewLabel }));
  await findHeading(headings.reviewChanges);
  await rendered.user.type(
    screen.getByRole("textbox", { name: "Enter the JSM ticket ID associated with this request" }),
    "123456",
  );
  await rendered.user.click(screen.getByRole("button", { name: "Submit" }));
  return rendered;
}

const environment = testConfig.environmentName;

describe("Change success", () => {
  it("reports that the journey finished successfully, with the transaction ID and no personal data", async () => {
    const events = captureUiEvents();
    await submitChange();
    await findHeading("Change success");

    await waitFor(() =>
      expect(events).toContainEqual({
        eventType: "JOURNEY_COMPLETED",
        journey: "role-management",
        step: "review-changes",
        outcome: "SUCCESS",
        transactionId: "TXN-000456",
        userType: "SG",
      }),
    );
    const sent = JSON.stringify(events);
    for (const value of ["x123456", "ITS-123456", "RPS-"]) {
      expect(sent).not.toContain(value);
    }
  });

  it("AC15: shows the success ribbon with the user, the environment and what to do next", async () => {
    await submitChange();

    const heading = await findHeading("Change success");
    expect(heading.closest(".ds_notification")).toHaveClass("ds_notification--success");
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent ===
            `LDAP groups for user x123456 in the ${environment} environment have been updated successfully.`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please validate the changes with the user, then update any corresponding JSM tickets."),
    ).toBeInTheDocument();
  });

  it("AC15: shows the user and the environment in bold", async () => {
    await submitChange();
    await findHeading("Change success");

    const paragraph = screen.getByText(/have been updated successfully/);
    const strong = Array.from(paragraph.querySelectorAll("strong")).map((element) => element.textContent);
    expect(strong).toEqual(["x123456", environment]);
  });

  it("AC15: still shows the transaction ID separately from the JSM ticket ID", async () => {
    server.use(
      http.post("*/role-change-requests", () => HttpResponse.json({ transactionId: "TXN-000999" }, { status: 201 })),
    );
    await submitChange();
    await findHeading("Change success");

    const reference = screen.getByRole("list", { name: "Request reference" });
    expect(within(reference).getByText("Transaction ID").closest("li")).toHaveTextContent("TXN-000999");
    expect(within(reference).getByText("JSM ticket ID").closest("li")).toHaveTextContent("ITS-123456");
  });

  it("AC15: Go to Home Page takes you to the home page", async () => {
    const { user } = await submitChange();
    await findHeading("Change success");

    await user.click(screen.getByRole("link", { name: "Go to Home Page" }));

    expect(await findHeading("Home")).toBeInTheDocument();
  });

  it("AC15: has no accessibility violations", async () => {
    const { container } = await submitChange();
    await findHeading("Change success");

    await expectNoAxeViolations(container);
  });
});

describe("Change failure", () => {
  it("AC16: shows the failure ribbon, the failure details heading and the next step", async () => {
    await submitChange("roleChangeServerError");

    const heading = await findHeading("Change failure");
    expect(heading.closest(".ds_notification")).toHaveClass("app_notification--error");
    expect(screen.getByRole("heading", { level: 2, name: "User role manager failure details" })).not.toHaveClass(
      "ds_h3",
    );
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent ===
            `LDAP groups for user x123456 in the ${environment} environment have not been updated.`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please update any corresponding JSM tickets and escalate to the relevant team."),
    ).toBeInTheDocument();
  });

  it("AC16: shows no error code ID or details", async () => {
    await submitChange("roleChangeServerError");
    await findHeading("Change failure");

    expect(screen.queryByText(/Error Code/i)).not.toBeInTheDocument();
  });

  it("AC16: stays on the review page with the permission message on 403", async () => {
    await submitChange("roleChangeForbidden");

    expect(await screen.findByRole("alert")).toHaveTextContent(/You do not have permission to do this./);
    expect(screen.queryByRole("heading", { level: 1, name: "Change failure" })).not.toBeInTheDocument();
  });

  it("AC16: reports the failure by code and never reports personal data", async () => {
    const events = captureUiEvents();
    await submitChange("roleChangeServerError");
    await findHeading("Change failure");

    await waitFor(() =>
      expect(events).toContainEqual({
        eventType: "SCREEN_ERROR",
        journey: "role-management",
        step: "review-changes",
        reasonCode: "HTTP_500",
        userType: "SG",
      }),
    );
    const sent = JSON.stringify(events);
    for (const value of ["x123456", "123456", "RPS-"]) {
      expect(sent).not.toContain(value);
    }
  });

  it("reports that the journey finished with a failure, by reason code only", async () => {
    const events = captureUiEvents();
    await submitChange("roleChangeServerError");
    await findHeading("Change failure");

    await waitFor(() =>
      expect(events).toContainEqual({
        eventType: "JOURNEY_COMPLETED",
        journey: "role-management",
        step: "review-changes",
        outcome: "FAILURE",
        reasonCode: "HTTP_500",
        userType: "SG",
      }),
    );
  });

  it("AC16: Go to Home Page takes you to the home page", async () => {
    const { user } = await submitChange("roleChangeServerError");
    await findHeading("Change failure");

    await user.click(screen.getByRole("link", { name: "Go to Home Page" }));

    expect(await findHeading("Home")).toBeInTheDocument();
  });

  it("AC16: sends you to the start of the journey if opened with nothing failed", async () => {
    renderApp({ route: "/role-manager/change-failed" });

    expect(await findHeading(headings.userDetails)).toBeInTheDocument();
  });

  it("AC16: has no accessibility violations", async () => {
    const { container } = await submitChange("roleChangeServerError");
    await findHeading("Change failure");

    await expectNoAxeViolations(container);
  });
});
