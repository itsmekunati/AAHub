import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/node";
import { captureUiEvents } from "../test/uiEvents";
import { recordUiEvent } from "./audit";

describe("Reporting UI audit events", () => {
  it("sends the event to the audit endpoint", async () => {
    const events = captureUiEvents();

    recordUiEvent({ eventType: "JOURNEY_CANCELLED", journey: "provisioning", step: "ticket" });

    await waitFor(() =>
      expect(events).toEqual([{ eventType: "JOURNEY_CANCELLED", journey: "provisioning", step: "ticket" }]),
    );
  });

  it.each([
    ["the endpoint fails", http.post("*/audit-events", () => new HttpResponse(null, { status: 500 }))],
    ["the network is down", http.post("*/audit-events", () => HttpResponse.error())],
  ])("never throws or rejects when %s", async (_case, handler) => {
    const rejections: unknown[] = [];
    const onRejection = (reason: unknown) => rejections.push(reason);
    process.on("unhandledRejection", onRejection);
    server.use(handler);

    expect(() => recordUiEvent({ eventType: "JOURNEY_STARTED", journey: "provisioning", step: "user-type" })).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 50));

    process.off("unhandledRejection", onRejection);
    expect(rejections).toEqual([]);
  });
});
