import { screen, within } from "@testing-library/react";
import { expectNoAxeViolations } from "../test/axe";
import { renderApp } from "../test/render";
import { findHeading, headings } from "./provision/testJourney";

describe("Home page", () => {
  it("AC1: offers the three tasks as links with a summary of each", async () => {
    renderApp();

    await findHeading("What do you want to do?");
    const main = within(screen.getByRole("main"));
    const tasks = [
      ["Provision user access to RP&S", "Provision a new user with access to RP&S"],
      ["User Role Manager", "Manage an existing user's LDAP group membership"],
      ["Check user's existing RP&S access", "Check a user's existing RP&S access using u/z number or email address"],
    ];
    for (const [name, summary] of tasks) {
      const link = main.getByRole("link", { name });
      expect(link.closest(".ds_category-item")).toHaveTextContent(summary ?? "");
    }
    expect(document.title).toBe("What do you want to do? - User access management");
  });

  it("AC1: says which instance this is and which environments it manages, from the configuration", async () => {
    renderApp();
    await findHeading("What do you want to do?");

    const inset = screen
      .getByText(/instance of Application Access Hub/)
      .closest(".ds_inset-text");
    expect(inset).toHaveTextContent(
      "You are viewing the Test environment instance of Application Access Hub which allows you to provision and manage users in the following environments only: UAT, OAT.",
    );
    expect(within(inset as HTMLElement).getByText("Test environment", { selector: "strong" })).toBeInTheDocument();
    expect(
      within(inset as HTMLElement).getByRole("link", { name: "Go to the Production instance" }),
    ).toHaveAttribute("href", "https://prod.example.test/");
  });

  it("AC1: starts the provisioning journey", async () => {
    const { user } = renderApp();

    await user.click(await screen.findByRole("link", { name: "Provision user access to RP&S" }));

    expect(await findHeading(headings.userType)).toBeInTheDocument();
  });

  it("AC1: says the other tasks are not available yet", async () => {
    const { user } = renderApp();

    await user.click(within(await screen.findByRole("main")).getByRole("link", { name: "User Role Manager" }));

    expect(await findHeading("This part of the service is not available yet")).toBeInTheDocument();
  });

  it("AC1: has no accessibility violations", async () => {
    const { container } = renderApp();
    await findHeading("What do you want to do?");

    await expectNoAxeViolations(container);
  });

  it.each(["/", "/provision/user-type", "/role-manager", "/no-such-page"])(
    "shows the Scottish Government header with the service name on %s",
    async (route) => {
      renderApp({ route });
      await screen.findByRole("heading", { level: 1 });

      const logo = screen.getByRole("img", { name: "The Scottish Government" });
      expect(logo).toHaveClass("ds_site-branding__logo-image");
      expect(logo.closest("a")).toHaveAttribute("href", "/");
      const title = screen.getByText("User access management", { selector: ".ds_site-branding__title" });
      expect(title.closest(".ds_site-header")).not.toBeNull();
    },
  );

  it.each(["/", "/provision/user-type", "/role-manager", "/no-such-page"])(
    "shows the site navigation under the header on %s",
    async (route) => {
      renderApp({ route });
      await screen.findByRole("heading", { level: 1 });

      const nav = screen.getByRole("navigation");
      expect(nav.closest(".ds_site-header")).not.toBeNull();
      expect(within(nav).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
        ["User provisioning", "/provision/user-type"],
        ["User Role Manager", "/role-manager"],
        ["Check existing access to RP&S", "/check-access"],
      ]);
    },
  );

  it("marks the current section in the site navigation", async () => {
    renderApp({ route: "/provision/user-type" });
    await screen.findByRole("heading", { level: 1 });

    const nav = within(screen.getByRole("navigation"));
    expect(nav.getByRole("link", { name: "User provisioning" })).toHaveAttribute("aria-current", "page");
    expect(nav.getByRole("link", { name: "User provisioning" })).toHaveClass("ds_current");
    expect(nav.getByRole("link", { name: "User Role Manager" })).not.toHaveAttribute("aria-current");
  });

  it.each(["/", "/provision/user-type", "/role-manager", "/no-such-page"])(
    "shows the Scottish Government footer with working links on %s",
    async (route) => {
      renderApp({ route });
      await screen.findByRole("heading", { level: 1 });

      const footer = within(screen.getByRole("contentinfo"));
      expect(footer.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "https://www.gov.scot/privacy/");
      expect(footer.getByRole("link", { name: "Accessibility statement" })).toHaveAttribute(
        "href",
        "https://www.gov.scot/accessibility/",
      );
      expect(footer.getByRole("link", { name: "Cookies" })).toHaveAttribute("href", "https://www.gov.scot/cookies/");
      expect(footer.getByRole("link", { name: "Open Government Licence v3.0" })).toHaveAttribute(
        "href",
        "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      );
      expect(footer.getByRole("img", { name: "Open Government Licence" })).toBeInTheDocument();
      expect(footer.getByText("© Crown Copyright")).toBeInTheDocument();
      expect(footer.getByRole("link", { name: "gov.scot" })).toHaveAttribute("href", "https://www.gov.scot/");
    },
  );

  it("shows the operator's role as EDITOR in the header until sign-in is built", async () => {
    renderApp();
    await findHeading("What do you want to do?");

    const role = screen.getByText("EDITOR");
    expect(role.closest(".ds_site-header")).not.toBeNull();
    expect(role.parentElement).toHaveTextContent("Signed in role: EDITOR");
  });

  it("shows a page not found message for an unknown address", async () => {
    renderApp({ route: "/no-such-page" });

    expect(await findHeading("Page not found")).toBeInTheDocument();
  });
});
