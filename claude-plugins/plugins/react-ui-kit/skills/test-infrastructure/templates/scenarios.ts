// src/mocks/scenarios.ts: TESTS AND DEVELOPMENT ONLY. Named overrides for every outcome the UI must handle.
// Error bodies MUST follow the error shape documented in openapi/openapi.json.
import { http, HttpResponse, delay } from "msw";

const USERS = "*/VERIFY/users"; // PLACEHOLDER: replace with real operations

export const scenarios = {
  success: [],
  empty: [http.get(USERS, () => HttpResponse.json([]))],
  validationError: [http.post(USERS, () => HttpResponse.json({ /* VERIFY: documented shape */ }, { status: 400 }))],
  unauthorised: [http.all(USERS, () => new HttpResponse(null, { status: 401 }))],
  forbidden: [http.all(USERS, () => new HttpResponse(null, { status: 403 }))],
  conflict: [http.post(USERS, () => HttpResponse.json({ /* VERIFY */ }, { status: 409 }))],
  serverError: [http.all(USERS, () => HttpResponse.json({ /* VERIFY */ }, { status: 500 }))],
  slow: [http.all(USERS, async () => { await delay(5_000); return HttpResponse.json([]); })],
  offline: [http.all(USERS, () => HttpResponse.error())],
} as const;

export type ScenarioName = keyof typeof scenarios;
