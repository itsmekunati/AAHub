import axe from "axe-core";

// Colour contrast needs real CSS and layout, which jsdom does not have; it is checked in the browser.
export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}
