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
- **Unavailable submit buttons:** only where a design asks for it. Use `aria-disabled="true"` (via `FormButtons unavailable`), never the native `disabled` attribute, except while a request is in flight. The button stays focusable, is described by a hint saying what to fix, and pressing it still shows the error summary.
- **Errors while typing:** an inline error that typing more cannot fix (e.g. a character that is not allowed, too long) may show as the operator types; others (e.g. too short) wait until the field loses focus or the form is submitted. The error summary changes only on submit, so it never takes focus while the operator types.

## Screen states
- Every data-driven screen handles loading, empty, error and success states. Never show a blank screen.
- Map errors to plain-English messages; never show raw server messages or stack traces.
- `401`: send the user back to sign in cleanly. `403`: show a clear "you do not have permission" message.

## Content
- Follow the Design System's writing guidance: plain English, sentence case, no jargon.

For the step-by-step procedure, use the `form-with-server-errors` skill. To check the running app, use `a11y-audit`; to check wording, use `content-review`.
