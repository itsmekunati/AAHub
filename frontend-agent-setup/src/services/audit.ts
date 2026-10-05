import { apiFetch } from "./apiClient";
import { auditEventsPath, type UiEvent } from "./auditEvents";

/**
 * Reports something the operator did in the UI. Fire and forget: it never waits, throws or
 * shows an error, so a failed report cannot get in the operator's way.
 */
export function recordUiEvent(event: UiEvent): void {
  try {
    apiFetch(auditEventsPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Nothing to do: reporting is best-effort.
  }
}
