import { render, screen } from "@testing-library/react";
import { Page } from "./Page";

function layoutOf(heading: HTMLElement) {
  return heading.closest(".ds_layout");
}

describe("Page layout", () => {
  it("uses the Design System article layout by default", () => {
    render(<Page title="An ordinary page">Content</Page>);

    const layout = layoutOf(screen.getByRole("heading", { level: 1 }));
    expect(layout).toHaveClass("ds_layout--article");
    expect(layout).not.toHaveClass("ds_layout--category-list");
  });

  it("uses the full-width Design System layout when asked", () => {
    render(
      <Page title="A wide page" layout="full-width">
        Content
      </Page>,
    );

    const layout = layoutOf(screen.getByRole("heading", { level: 1 }));
    expect(layout).toHaveClass("ds_layout--category-list");
    expect(layout).not.toHaveClass("ds_layout--article");
  });
});
