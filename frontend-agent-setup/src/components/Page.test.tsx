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

describe("Page title size", () => {
  it("shows the title at the Design System page title size by default", () => {
    render(<Page title="An ordinary page">Content</Page>);

    const heading = screen.getByRole("heading", { level: 1, name: "An ordinary page" });
    expect(heading).toHaveClass("ds_page-header__title");
    expect(heading).not.toHaveClass("ds_h2");
  });

  it("shows the title at the smaller h2 size when asked, and keeps it the page's h1", () => {
    render(
      <Page title="A step in a journey" titleSize="h2">
        Content
      </Page>,
    );

    const heading = screen.getByRole("heading", { level: 1, name: "A step in a journey" });
    expect(heading).toHaveClass("ds_page-header__title", "ds_h2");
    expect(heading).toHaveFocus();
  });
});
