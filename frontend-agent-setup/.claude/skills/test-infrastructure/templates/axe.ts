// src/test/axe.ts: accessibility assertion. VERIFY the axe integration for the chosen test runner.
import { axe } from "jest-axe"; // or the equivalent for the chosen runner

export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe(container);
  expect(results.violations).toEqual([]);
}
