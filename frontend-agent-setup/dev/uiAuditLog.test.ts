import { toAuditLine } from "./uiAuditLog";

const now = new Date("2026-10-05T14:30:22.123Z");

describe("Local UI audit log line", () => {
  it("writes one JSON line with the time and the UI category", () => {
    const result = toAuditLine({ eventType: "JOURNEY_CANCELLED", journey: "provisioning", step: "ticket" }, now);

    expect(result).toEqual({
      ok: true,
      line: '{"timestamp":"2026-10-05T14:30:22.123Z","eventCategory":"UI","eventType":"JOURNEY_CANCELLED","journey":"provisioning","step":"ticket"}',
    });
  });

  it("keeps the optional details", () => {
    const result = toAuditLine(
      {
        eventType: "VALIDATION_BLOCKED",
        journey: "provisioning",
        step: "ticket",
        reasonCode: "FORMAT",
        fields: ["jira-ticket-id"],
        userType: "government",
        transactionId: "TXN-000123",
      },
      now,
    );

    expect(result.ok && JSON.parse(result.line)).toMatchObject({
      reasonCode: "FORMAT",
      fields: ["jira-ticket-id"],
      userType: "government",
      transactionId: "TXN-000123",
    });
  });

  it("drops anything it does not expect, so personal data cannot reach the file", () => {
    const result = toAuditLine(
      { eventType: "JOURNEY_STARTED", journey: "provisioning", step: "user-type", email: "alex.example@example.test" },
      now,
    );

    expect(result.ok && result.line).not.toContain("alex.example@example.test");
  });

  it("keeps each record on one line", () => {
    const result = toAuditLine({ eventType: "SCREEN_ERROR", journey: "provisioning", step: "ticket\nfake line" }, now);

    expect(result.ok && result.line.includes("\n")).toBe(false);
    expect(result.ok && result.line).toContain('"step":"ticket fake line"');
  });

  it.each([
    ["an unknown event type", { eventType: "SOMETHING_ELSE", journey: "provisioning", step: "ticket" }],
    ["no journey", { eventType: "JOURNEY_STARTED", step: "ticket" }],
    ["no step", { eventType: "JOURNEY_STARTED", journey: "provisioning" }],
    ["an over-long value", { eventType: "JOURNEY_STARTED", journey: "provisioning", step: "x".repeat(101) }],
    ["something that is not an object", "JOURNEY_STARTED"],
  ])("rejects %s", (_case, body) => {
    expect(toAuditLine(body, now)).toEqual({ ok: false });
  });
});
