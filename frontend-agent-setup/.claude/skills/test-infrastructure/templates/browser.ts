// src/mocks/browser.ts: DEVELOPMENT SERVER ONLY. Import it dynamically, and only when the
// development-only mock flag is set, so it is never part of a production build.
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { scenarios, type ScenarioName } from "./scenarios";

export async function startMockApi(scenario: ScenarioName = "success"): Promise<void> {
  const worker = setupWorker(...scenarios[scenario], ...handlers);
  await worker.start({ onUnhandledRequest: "error" });
}
