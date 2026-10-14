import { screen, within } from "@testing-library/react";
import { expectNoAxeViolations } from "../../test/axe";
import { renderApp } from "../../test/render";
import { testConfig } from "../../test/testConfig";
import {
  findHeading,
  headings,
  identifierField,
  reviewLabel,
  reviewUnavailableHint,
  start,
  walkToSelectGroups,
} from "./testJourney";

const tabNames = ["RP&S", "LPIS", "LIS", "AgsCensus", "Claims", "SRSP", "Contracts", "Debts", "Apply"];
const publicRule = "User type is Public, this user type must belong to one or both of these groups.";

function reviewButton() {
  return screen.getByRole("button", { name: reviewLabel });
}

async function openPage(identifier?: string, userType?: string) {
  const rendered = renderApp({ route: start });
  await walkToSelectGroups(rendered.user, identifier, userType);
  return rendered;
}

describe("Review and select LDAP groups", () => {
  it("AC8: shows who and which environment the changes are for, with a Previous link", async () => {
    await openPage();

    expect(screen.getByText(/For user/)).toHaveTextContent(
      `For user x123456 in ${testConfig.environmentName} environment`,
    );
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/role-manager/user-details");
    expect(document.title).toBe("Review and select LDAP groups - Application Access Hub");
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("ds_h2");
  });

  it("AC8: shows one tab per application, with RP&S selected", async () => {
    await openPage();

    const tabs = within(screen.getByRole("tablist")).getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(tabNames);
    expect(screen.getByRole("tab", { name: "RP&S" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "RP&S" })).toBeVisible();
    expect(screen.getByRole("group", { name: "Below is the list of RP&S LDAP groups" })).toHaveAccessibleDescription(
      "Review and select the groups the user needs to be part of",
    );
  });

  it("AC8: ticks the groups the user is already in", async () => {
    await openPage();

    expect(screen.getByRole("checkbox", { name: "RPS - RegisteredUser" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" })).not.toBeChecked();
  });

  it("AC8: switches tabs by clicking and with the arrow keys", async () => {
    const { user } = await openPage();

    await user.click(screen.getByRole("tab", { name: "LIS" }));
    expect(screen.getByRole("tab", { name: "LIS" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("checkbox", { name: "LIS - Example group A" })).toBeVisible();
    expect(screen.queryByRole("checkbox", { name: "RPS - RegisteredUser" })).not.toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "AgsCensus" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "AgsCensus" })).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "LPIS" })).toHaveFocus();

    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "RP&S" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Apply" })).toHaveFocus();
  });

  it("AC8: keeps ticks when the operator moves between tabs", async () => {
    const { user } = await openPage();

    await user.click(screen.getByRole("tab", { name: "LPIS" }));
    await user.click(screen.getByRole("checkbox", { name: "LPIS - Example group B" }));
    await user.click(screen.getByRole("tab", { name: "RP&S" }));
    await user.click(screen.getByRole("tab", { name: "LPIS" }));

    expect(screen.getByRole("checkbox", { name: "LPIS - Example group B" })).toBeChecked();
  });

  it("AC9: shows Review as unavailable, and explained, until the selection changes", async () => {
    const { user } = await openPage();

    expect(reviewButton()).toHaveAttribute("aria-disabled", "true");
    expect(reviewButton()).toHaveAccessibleDescription(reviewUnavailableHint);

    await user.click(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }));
    expect(reviewButton()).not.toHaveAttribute("aria-disabled");

    await user.click(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }));
    expect(reviewButton()).toHaveAttribute("aria-disabled", "true");
  });

  it("AC9: pressing Review with nothing changed shows the error summary", async () => {
    const { user } = await openPage();

    await user.click(reviewButton());

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    expect(summary).toHaveTextContent("Select or clear at least one group to make a change");
    expect(screen.getByRole("heading", { level: 1, name: headings.selectGroups })).toBeInTheDocument();
  });

  it("AC10: shows the backend's rule for the user type", async () => {
    await openPage("jo.bloggs", "public");

    expect(screen.getByText(publicRule)).toBeInTheDocument();
  });

  it("AC10: will not review a Public user with no RP&S group, and the error opens the right tab", async () => {
    const { user } = await openPage("jo.bloggs", "public");

    await user.click(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }));
    await user.click(screen.getByRole("tab", { name: "LPIS" }));
    await user.click(reviewButton());

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    await user.click(within(summary).getByRole("link", { name: publicRule }));

    expect(screen.getByRole("tab", { name: "RP&S" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("checkbox", { name: "RPS - RegisteredUser" })).toHaveFocus();
    expect(screen.getByRole("group", { name: "Below is the list of RP&S LDAP groups" })).toHaveAccessibleDescription(
      expect.stringContaining(`Error: ${publicRule}`),
    );
  });

  it("AC11: Review shows the changes to check", async () => {
    const { user } = await openPage();

    await user.click(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }));
    await user.click(reviewButton());

    expect(await findHeading(headings.reviewChanges)).toBeInTheDocument();
  });

  it("AC8: Previous goes back to the user details with the answers kept", async () => {
    const { user } = await openPage();

    await user.click(screen.getByRole("link", { name: "Previous" }));

    await findHeading(headings.userDetails);
    expect(identifierField()).toHaveValue("x123456");
  });

  it("AC8: Cancel returns to the home page", async () => {
    const { user } = await openPage();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await findHeading("Home")).toBeInTheDocument();
  });

  it("AC8: sends you back to the user details if no user has been looked up", async () => {
    renderApp({ route: "/role-manager/select-groups" });

    expect(await findHeading(headings.userDetails)).toBeInTheDocument();
  });

  it("AC8: has no accessibility violations, with and without errors", async () => {
    const { container, user } = await openPage("jo.bloggs", "public");
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole("checkbox", { name: "RPS - TransactionalCustomer" }));
    await user.click(reviewButton());
    await expectNoAxeViolations(container);
  });
});
