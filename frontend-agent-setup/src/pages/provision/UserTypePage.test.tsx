import { screen, within } from "@testing-library/react";
import { expectNoAxeViolations } from "../../test/axe";
import { renderApp } from "../../test/render";
import { findHeading, headings } from "./testJourney";

const route = "/provision/user-type";
const hint = "You will be able to select environment after selecting user type";

describe("Select the user type", () => {
  it("AC2: offers Scottish Government, Scottish Forestry and NatureScot as radio buttons with Cancel and Next", async () => {
    renderApp({ route });

    await findHeading(headings.userType);
    const group = screen.getByRole("group", { name: "User type" });
    expect(within(group).getAllByRole("radio").map((radio) => radio.getAttribute("value"))).toEqual([
      "SG",
      "FGS",
      "SNH",
    ]);
    expect(within(group).getByRole("radio", { name: "Scottish Government" })).toHaveAttribute("value", "SG");
    expect(within(group).getByRole("radio", { name: "Scottish Forestry" })).toHaveAttribute("value", "FGS");
    expect(within(group).getByRole("radio", { name: "NatureScot" })).toHaveAttribute("value", "SNH");
    expect(within(group).getByRole("radio", { name: "Scottish Government" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("AC2: says the environment is chosen later, and does not show the group's name", async () => {
    renderApp({ route });
    expect(await findHeading(headings.userType)).toHaveClass("ds_h2");

    expect(screen.getByText(hint)).toHaveClass("ds_hint-text");
    expect(screen.getByRole("group", { name: "User type" })).toHaveAccessibleDescription(hint);
    expect(screen.getByText("User type", { selector: "legend" })).toHaveClass("visually-hidden");
  });

  it("AC2: shows Next as unavailable, and says why, until a user type is selected", async () => {
    const { user } = renderApp({ route });
    await findHeading(headings.userType);

    const next = screen.getByRole("button", { name: "Next" });
    expect(next).toHaveAttribute("aria-disabled", "true");
    expect(next).toBeEnabled();
    expect(next).toHaveAccessibleDescription("Select a user type to continue");

    await user.click(screen.getByRole("radio", { name: "NatureScot" }));

    expect(next).not.toHaveAttribute("aria-disabled");
    expect(next).not.toHaveAccessibleDescription();
  });

  it("AC2: asks for a user type when none is selected, and moves focus to the error summary", async () => {
    const { user } = renderApp({ route });
    await findHeading(headings.userType);

    await user.click(screen.getByRole("button", { name: "Next" }));

    const summary = screen.getByRole("alert");
    expect(within(summary).getByRole("heading", { name: "There is a problem" })).toBeInTheDocument();
    expect(summary).toHaveFocus();
    expect(within(summary).getByRole("link", { name: "Select a user type" })).toHaveAttribute(
      "href",
      "#user-type-SG",
    );
    expect(screen.getByRole("group", { name: "User type" })).toHaveAccessibleDescription(
      `${hint} Error: Select a user type`,
    );
    expect(document.title).toBe("Error: Select the user type - Application Access Hub");
  });

  it("AC2: moves to the user identifier step with the chosen type", async () => {
    const { user } = renderApp({ route });
    await findHeading(headings.userType);

    await user.click(screen.getByRole("radio", { name: "Scottish Forestry" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await findHeading(headings.userIdentifier);
    expect(screen.getByText("Scottish Forestry")).toBeInTheDocument();
  });

  it("AC2: pressing Next twice moves on one step only", async () => {
    const { user } = renderApp({ route });
    await findHeading(headings.userType);

    await user.click(screen.getByRole("radio", { name: "Scottish Government" }));
    await user.dblClick(screen.getByRole("button", { name: "Next" }));

    expect(await findHeading(headings.userIdentifier)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("AC2: Cancel returns to the home page", async () => {
    const { user } = renderApp({ route });
    await findHeading(headings.userType);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await findHeading("Home")).toBeInTheDocument();
  });

  it("AC2: has no accessibility violations, with and without errors", async () => {
    const { container, user } = renderApp({ route });
    await findHeading(headings.userType);
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole("button", { name: "Next" }));
    await expectNoAxeViolations(container);
  });
});
