import { screen, waitFor, within } from "@testing-library/react";
import { renderApp } from "../test/render";
import { captureUiEvents } from "../test/uiEvents";

// The home page links to the same places, so look for the tabs inside the site navigation only.
async function navigationTab(name: string) {
  return within(await screen.findByRole("navigation")).getByRole("link", { name });
}

describe("Site navigation tabs", () => {
  it.each([
    ["User provisioning", "provisioning"],
    ["User Role Manager", "role-management"],
    ["Check existing access to RP&S", "check-access"],
  ])("reports which tab the operator selected: %s", async (label, tab) => {
    const events = captureUiEvents();
    const { user } = renderApp();

    await user.click(await navigationTab(label));

    await waitFor(() =>
      expect(events).toContainEqual({ eventType: "TAB_SELECTED", journey: "navigation", step: "site-header", tab }),
    );
  });

  it("still opens the tab when events cannot be reported", async () => {
    const { user } = renderApp({ scenario: "auditUnavailable" });

    await user.click(await navigationTab("User Role Manager"));

    expect(await screen.findByRole("heading", { level: 1, name: "Provide the user details" })).toBeInTheDocument();
  });
});
