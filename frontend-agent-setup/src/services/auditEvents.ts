// TEMPORARY CONTRACT: hand-written until the backend publishes openapi/openapi.json.
// The events the UI reports are things the backend cannot see for itself. This file has no
// imports so the development server's log writer (dev/uiAuditLog.ts) can share it.
export const UI_EVENT_TYPES = [
  "JOURNEY_STARTED",
  "JOURNEY_CANCELLED",
  "VALIDATION_BLOCKED",
  "SCREEN_ERROR",
  "JOURNEY_COMPLETED",
  "TAB_SELECTED",
] as const;
export type UiEventType = (typeof UI_EVENT_TYPES)[number];

/** How a journey finished: its final submission was accepted or not. */
export const UI_OUTCOMES = ["SUCCESS", "FAILURE"] as const;
export type UiOutcome = (typeof UI_OUTCOMES)[number];

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
  /** JOURNEY_COMPLETED only. */
  outcome?: UiOutcome;
  /** TAB_SELECTED only: which site navigation tab, by name, never a URL. */
  tab?: string;
}

export const auditEventsPath = "/audit-events";
