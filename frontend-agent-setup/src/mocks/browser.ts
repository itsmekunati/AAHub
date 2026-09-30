// DEVELOPMENT SERVER ONLY. Imported dynamically in mock mode, so it never reaches a production build.
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { scenarios, type ScenarioName } from "./scenarios";

function isScenarioName(value: string | null): value is ScenarioName {
  return value !== null && Object.hasOwn(scenarios, value);
}

export async function startMockApi(): Promise<void> {
  const requested = new URLSearchParams(window.location.search).get("scenario");
  const scenario: ScenarioName = isScenarioName(requested) ? requested : "success";
  const worker = setupWorker(...scenarios[scenario], ...handlers);
  await worker.start({ onUnhandledRequest: "bypass" });
}
