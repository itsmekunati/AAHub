# Accessibility checklist (WCAG 2.2 AA)

Reference for `.claude/rules/forms-accessibility.md`. The Generator uses it for its self-check and the Evaluator tests every item on every screen in scope. Automated checks (axe) catch only part of this list; the rest must be checked by hand in the browser.

Quick reference: https://www.w3.org/WAI/WCAG22/quickref/

## Keyboard
- [ ] Every action is reachable and usable with Tab, Shift+Tab, Enter and Space only.
- [ ] Focus order follows the visual and reading order.
- [ ] No keyboard traps.
- [ ] Focus is always visible, and not hidden behind sticky headers or other content.

## Structure
- [ ] Exactly one `h1` per page; headings in order with no skipped levels.
- [ ] Landmarks: header, main, footer (and nav where present).
- [ ] The page `<title>` is unique and changes with the route.
- [ ] On route change, focus moves to a sensible place (e.g. the `h1` or main content).
- [ ] A skip link to main content is present and works.

## Forms
- [ ] Every field has a visible `<label>` associated with it.
- [ ] Hint text is linked with `aria-describedby`.
- [ ] Inline error messages are linked with `aria-describedby` and describe how to fix the problem.
- [ ] An error summary appears at the top on failed submit, receives focus, and each link moves focus to its field.
- [ ] Server validation errors use the same inline and summary patterns.
- [ ] Required fields are indicated in text, not by colour alone.
- [ ] Fields that collect information about the user use appropriate `autocomplete` values.
- [ ] Information already entered is not asked for again in the same journey (WCAG 2.2, 3.3.7).

## Visual
- [ ] Text contrast at least 4.5:1 (3:1 for large text); UI components and focus indicators at least 3:1.
- [ ] Nothing relies on colour alone.
- [ ] Usable at 320 CSS px wide without horizontal scrolling, and at 200% zoom.
- [ ] Interactive targets are at least 24 by 24 CSS px, or have enough spacing (WCAG 2.2, 2.5.8).

## Dynamic content
- [ ] Loading, success and error messages are announced to screen readers (live regions or focus moves).
- [ ] No content changes context unexpectedly on focus or input.
- [ ] Session timeouts warn the user and let them continue where possible.

## Content
- [ ] Plain English, sentence case, no jargon (Design System writing guidance).
- [ ] Link and button text makes sense out of context.

## Automated
- [ ] axe reports zero violations on every screen in scope.
