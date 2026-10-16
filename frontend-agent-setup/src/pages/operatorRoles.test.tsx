import { screen, within } from "@testing-library/react";
import { expectNoAxeViolations } from "../test/axe";
import { renderApp } from "../test/render";
import { findHeading } from "./provision/testJourney";

// What each operator role is shown. This is visibility only: the backend enforces every permission.
describe("Operator roles", () => {
  const allTasks = ["Provision user access to RP&S", "User Role Manager", "Check user's existing RP&S access"];
  const allTabs = ["User provisioning", "User Role Manager", "Check existing access to RP&S"];

  async function homeTaskLinks() {
    await findHeading("Home");
    return within(within(screen.getByRole("main")).getByRole("list"))
      .getAllByRole("link")
      .map((link) => link.textContent);
  }

  function navigationTabs() {
    return within(screen.getByRole("navigation"))
      .getAllByRole("link")
      .map((link) => link.textContent);
  }

  it.each([
    ["editor", "EDITOR"],
    ["viewer", "VIEWER"],
  ] as const)("shows a %s's role in the header", async (role, label) => {
    renderApp({ role });
    await findHeading("Home");

    expect(screen.getByText(label).parentElement).toHaveTextContent(`Signed in role: ${label}`);
  });

  it("shows an editor all three tasks and tabs", async () => {
    renderApp({ role: "editor" });

    expect(await homeTaskLinks()).toEqual(allTasks);
    expect(navigationTabs()).toEqual(allTabs);
  });

  it("shows a viewer only User Role Manager and Check existing access, never provisioning", async () => {
    renderApp({ role: "viewer" });

    expect(await homeTaskLinks()).toEqual(["User Role Manager", "Check user's existing RP&S access"]);
    expect(navigationTabs()).toEqual(["User Role Manager", "Check existing access to RP&S"]);
  });

  it("lets a viewer use User Role Manager", async () => {
    renderApp({ role: "viewer", route: "/role-manager" });

    expect(await findHeading("Provide the user details")).toBeInTheDocument();
  });

  it.each(["/provision", "/provision/user-type", "/provision/ticket"])(
    "shows a viewer a permission page when they open %s directly",
    async (route) => {
      const { container } = renderApp({ role: "viewer", route });

      expect(await findHeading("You do not have permission to use this part of the service")).toBeInTheDocument();
      expect(document.title).toBe(
        "You do not have permission to use this part of the service - Application Access Hub",
      );
      expect(screen.getByRole("link", { name: "Return to the start" })).toHaveAttribute("href", "/");
      await expectNoAxeViolations(container);
    },
  );
});
