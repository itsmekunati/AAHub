import { screen, within } from "@testing-library/react";
import { expectNoAxeViolations } from "../../test/axe";
import { renderApp } from "../../test/render";
import { findHeading, headings } from "./testJourney";

const route = "/provision/user-type";

describe("Select the user type", () => {
  it("AC2: offers Government, Forestry and Nature as radio buttons with Cancel and Next", async () => {
    renderApp({ route });

    await findHeading(headings.userType);
    const group = screen.getByRole("group", { name: "User type" });
    expect(within(group).getAllByRole("radio").map((radio) => radio.getAttribute("value"))).toEqual([
      "government",
      "forestry",
      "nature",
    ]);
    expect(within(group).getByRole("radio", { name: "Government" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
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
      "#user-type-government",
    );
    expect(screen.getByRole("group", { name: "User type" })).toHaveAccessibleDescription(
      "Error: Select a user type",
    );
    expect(document.title).toBe("Error: Select the user type - User access management");
  });

  it("AC2: moves to the user number step with the chosen type", async () => {
    const { user } = renderApp({ route });
    await findHeading(headings.userType);

    await user.click(screen.getByRole("radio", { name: "Forestry" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await findHeading(headings.userNumber);
    expect(screen.getByText("Forestry")).toBeInTheDocument();
  });

  it("AC2: Cancel returns to the home page", async () => {
    const { user } = renderApp({ route });
    await findHeading(headings.userType);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await findHeading("What do you want to do?")).toBeInTheDocument();
  });

  it("AC2: has no accessibility violations, with and without errors", async () => {
    const { container, user } = renderApp({ route });
    await findHeading(headings.userType);
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole("button", { name: "Next" }));
    await expectNoAxeViolations(container);
  });
});
