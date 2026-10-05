// TEMPORARY CONTRACT: hand-written until the backend publishes openapi/openapi.json.
// The events the UI reports are things the backend cannot see for itself. This file has no
// imports so the development server's log writer (dev/uiAuditLog.ts) can share it.
export const UI_EVENT_TYPES = ["JOURNEY_STARTED", "JOURNEY_CANCELLED", "VALIDATION_BLOCKED", "SCREEN_ERROR"] as const;
export type UiEventType = (typeof UI_EVENT_TYPES)[number];

/** Never put personal data, user identifiers, ticket text or field values in an event. */
export interface UiEvent {
  eventType: UiEventType;
  journey: string;
  step: string;
  reasonCode?: string;
  /** Names of the fields involved, never their values. */
  fields?: string[];
  userType?: string;
  transactionId?: string;
}

export const auditEventsPath = "/audit-events";
