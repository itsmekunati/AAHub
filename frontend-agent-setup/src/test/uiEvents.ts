// TESTS ONLY: collects the audit events the UI reports during a test.
import { http, HttpResponse } from "msw";
import { server } from "../mocks/node";

export function captureUiEvents(): Record<string, unknown>[] {
  const events: Record<string, unknown>[] = [];
  server.use(
    http.post("*/audit-events", async ({ request }) => {
      const body: unknown = await request.json();
      if (typeof body === "object" && body !== null) {
        events.push({ ...body });
      }
      return new HttpResponse(null, { status: 202 });
    }),
  );
  return events;
}
