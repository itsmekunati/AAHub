// TESTS ONLY. In the development server the browser mock lets this request through to the
// local log writer (dev/uiAuditLog.ts), so this handler is used by the test server alone.
import { http, HttpResponse } from "msw";
import { UI_EVENT_TYPES, auditEventsPath } from "../services/auditEvents";

export const auditHandlers = [
  http.post(`*${auditEventsPath}`, async ({ request }) => {
    const body: unknown = await request.json();
    const eventType: unknown = typeof body === "object" && body !== null ? Reflect.get(body, "eventType") : undefined;
    const known = UI_EVENT_TYPES.some((type) => type === eventType);
    return new HttpResponse(null, { status: known ? 202 : 400 });
  }),
];
