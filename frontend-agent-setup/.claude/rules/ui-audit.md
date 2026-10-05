---
paths:
  - "src/pages/**"
  - "src/services/**"
  - "src/mocks/**"
  - "dev/**"
---
# UI audit events

The backend audits every API call. The UI reports only what the backend cannot see: what an operator does in the browser without calling the API.

- **Events** (the full list is `UI_EVENT_TYPES` in `src/services/auditEvents.ts`):
  - `JOURNEY_STARTED`: the operator opens a journey.
  - `JOURNEY_CANCELLED`: the operator presses Cancel; `step` says where.
  - `VALIDATION_BLOCKED`: a client-side check stops the operator; `fields` names what failed.
  - `SCREEN_ERROR`: the UI shows a failure; `reasonCode` is `HTTP_<status>` or `NO_RESPONSE`.
- **Do not report** page views, keystrokes, sign-in or sign-out, or anything the backend audits itself (submissions, look-ups, `401`/`403` on their own).
- **No personal data, ever.** An event carries the event type, journey, step, reason code, field **names**, user type and transaction ID only. Never names, email addresses, user identifiers, manager X numbers, ticket text or anything the operator typed.
- **One caller.** Only `recordUiEvent` in `src/services/audit.ts` calls the endpoint (`POST /audit-events`, part of the temporary contract). Pages use the helpers in `src/pages/provision/journeyAudit.ts`; add a helper there for a new journey.
- **Fire and forget.** Reporting never waits, throws, shows an error or blocks a step. Do not queue events in `localStorage` or `sessionStorage`. A lost event is accepted.
- **UI events are supplementary.** They are client-reported and best-effort, so never treat one as proof that something did or did not happen. The backend's own records are the source of truth.
- **Local log file (development only).** With `npm run dev`, the Vite plugin in `dev/uiAuditLog.ts` receives the events and appends one JSON line each to `logs/ui-audit.log` (ignored by Git). It keeps only the fields it expects, rejects unknown event types and is never part of a production build. It is a convenience for developers, not a compliance audit log.
- **Tests:** collect events with `captureUiEvents()` from `src/test/uiEvents.ts`. Every new event needs a test that it is sent and that it carries no personal data, and the journey must still work under the `auditUnavailable` scenario.
- When adding an event type, add it to `UI_EVENT_TYPES`, to this list, and ask for it to be added to the backend's allowed list.
