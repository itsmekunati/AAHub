// DEVELOPMENT SERVER ONLY. Writes the events the UI reports to logs/ui-audit.log so they can be
// read locally before the backend exists. It is a convenience, not a compliance audit log.
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";
import { UI_EVENT_TYPES } from "../src/services/auditEvents";

const maxLength = 100;
const maxFields = 20;
const maxBodyBytes = 4096;
// Matches apiBaseUrl in public/config.json plus auditEventsPath.
const localEndpoint = "/api/audit-events";
const logFile = "logs/ui-audit.log";

export type AuditLine = { ok: true; line: string } | { ok: false };

function clean(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > maxLength) {
    return undefined;
  }
  const cleaned = value.replace(/[\r\n]+/g, " ").trim();
  return cleaned || undefined;
}

/** Builds the log line from a reported event, keeping only the fields it expects. */
export function toAuditLine(body: unknown, now: Date): AuditLine {
  if (typeof body !== "object" || body === null) {
    return { ok: false };
  }
  const read = (key: string): unknown => Reflect.get(body, key);
  const eventType = UI_EVENT_TYPES.find((type) => type === read("eventType"));
  const journey = clean(read("journey"));
  const step = clean(read("step"));
  if (!eventType || !journey || !step) {
    return { ok: false };
  }
  const fields = read("fields");
  const record = {
    timestamp: now.toISOString(),
    eventCategory: "UI",
    eventType,
    journey,
    step,
    reasonCode: clean(read("reasonCode")),
    fields: Array.isArray(fields) ? fields.slice(0, maxFields).map(clean).filter(Boolean) : undefined,
    userType: clean(read("userType")),
    transactionId: clean(read("transactionId")),
  };
  return { ok: true, line: JSON.stringify(record) };
}

export function uiAuditLogPlugin(): Plugin {
  return {
    name: "ui-audit-log",
    apply: "serve",
    configureServer(server) {
      const file = resolve(server.config.root, logFile);
      server.middlewares.use(localEndpoint, (request, response) => {
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end();
          return;
        }
        let raw = "";
        request.on("data", (chunk: unknown) => {
          if (raw.length <= maxBodyBytes) {
            raw += String(chunk);
          }
        });
        request.on("end", () => {
          let result: AuditLine = { ok: false };
          try {
            result = raw.length > maxBodyBytes ? { ok: false } : toAuditLine(JSON.parse(raw), new Date());
          } catch {
            // Not JSON: rejected below.
          }
          if (result.ok) {
            mkdirSync(dirname(file), { recursive: true });
            appendFileSync(file, `${result.line}\n`);
          }
          response.statusCode = result.ok ? 202 : 400;
          response.end();
        });
      });
    },
  };
}
