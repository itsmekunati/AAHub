---
paths:
  - "src/components/**"
  - "src/pages/**"
---
# Forms, accessibility and content

## Accessibility (mandatory)
- Target **WCAG 2.2 AA**: semantic HTML, full keyboard operation, visible focus, correct ARIA only where needed.
- One `h1` per page, headings in order, landmarks, a page title that changes with the route, and focus managed on route change.
- Usable at 320 CSS px wide and at 200% zoom.
- The full checklist used in evaluation is in `docs/reference/accessibility-checklist.md`.

## Forms
- Follow the Design System's form guidance: a label on every field, hint text, inline error messages **plus** an error summary, clear validation wording.
- On a failed submit, move focus to the error summary; each summary link moves focus to its field.
- Show **server validation errors** using the same inline error and error summary patterns.
- Basic client-side checks (e.g. email format) are for convenience only. The server result is always authoritative.

## Screen states
- Every data-driven screen handles loading, empty, error and success states. Never show a blank screen.
- Map errors to plain-English messages; never show raw server messages or stack traces.
- `401`: send the user back to sign in cleanly. `403`: show a clear "you do not have permission" message.

## Content
- Follow the Design System's writing guidance: plain English, sentence case, no jargon.

For the step-by-step procedure, use the `form-with-server-errors` skill.
