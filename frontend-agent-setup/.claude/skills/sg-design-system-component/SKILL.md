---
name: sg-design-system-component
description: Test-first procedure for building or changing a React component that renders a Scottish Government Design System component (button, text input, error summary, notification banner, table, etc.) with the exact documented markup, React-safe JavaScript initialisation and accessibility tests written first. Use this whenever you create or modify anything in src/components/, or need Design System markup in a page, even for a small change.
---

# Build a Design System component (test-first)

Relevant rules: `.claude/rules/tdd.md`, `design-system.md`, `forms-accessibility.md`, `code-style.md`. Follow the `tdd-cycle` skill.

## 1. Check it exists
- Search `src/components/` first; reuse or extend an existing wrapper.
- Find the component on https://designsystem.gov.scot and read its HTML example, class names, variants and accessibility notes. If there is no Design System component for the need, **stop and ask** before building a custom one.

## 2. Red: write the failing tests first
Add a stub component that renders `null`, then write tests that assert:
- the **documented markup**: key elements and Design System class names are present, per variant;
- **accessibility**: label, hint and error are associated (`htmlFor`, `aria-describedby`); correct roles; axe reports no violations;
- **behaviour**: keyboard operation, events fire with the right values, error state renders the documented error markup.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: copy the documented markup, not the files
- Render the markup **exactly** in JSX (`class` → `className`, `for` → `htmlFor`). Keep element types, class names, ARIA attributes and structure identical.
- Never copy files from the Design System repository and never edit anything from `@scottish-government/design-system`.
- Props: expose only what varies (label, hint, error message, id, value, handlers, variant). Generate stable ids with `useId`. Strict types, no `any`.
- JavaScript behaviour (only if needed): initialise the Design System's script for this element inside `useEffect` with a ref, following the official documentation, and clean up on unmount.
- Styling: no custom CSS by default; if unavoidable, use the Design System's Sass variables and tokens in `src/styles/`, and note why.

Run until green, then the full suite, type check and lint. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. Refactor
Tidy with tests green. Commit `refactor(sprint-NN): ...` if anything changed.
