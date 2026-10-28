---
name: sg-design-system-component
description: Test-first procedure for building or changing an AngularJS component that renders a Scottish Government Design System component (button, text input, error summary, notification banner, table, etc.) with the exact documented markup, AngularJS-safe JavaScript initialisation and accessibility tests written first. Use this whenever you create or modify anything in av-ui/src/app/components/, or need Design System markup in a page, even for a small change.
---

# Build a Design System component (test-first)

Relevant rules: `.claude/rules/tdd.md`, `design-system.md`, `forms-accessibility.md`, `frontend-code-style.md`. Follow the `angularjs-micronaut-kit:tdd-cycle` skill.

## 1. Check it exists
- Search `av-ui/src/app/components/` first; reuse or extend an existing component.
- Find the component on https://designsystem.gov.scot and read its HTML example, class names, variants and accessibility notes. If there is no Design System component for the need, **stop and ask** before building a custom one.

## 2. Red: write the failing tests first
Register a stub component with an empty template, then write tests (with `compileComponent`) that assert:
- the **documented markup**: key elements and Design System class names are present, per variant;
- **accessibility**: label, hint and error are associated (`for`, `aria-describedby`); correct roles; axe reports no violations;
- **behaviour**: keyboard operation, `&` callbacks fire with the right values, the error state renders the documented error markup.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: copy the documented markup, not the files
- Put the markup in the component's template **exactly** as documented. Keep element types, class names, ARIA attributes and structure identical.
- Never copy files from the Design System repository and never edit anything from `@scottish-government/design-system`.
- Bindings: expose only what varies (label, hint, error message, id, value, callbacks, variant) as one-way (`<`, `@`) and callback (`&`) bindings. Generate a stable id in `$onInit` when none is passed.
- JavaScript behaviour (only if needed): initialise the Design System's script for this element in `$postLink`, following the official documentation, and clean up in `$onDestroy`.
- Styling: no custom CSS by default; if unavoidable, use the Design System's Sass variables and tokens in `av-ui/src/styles/`, and note why.

Run until green, then the full suite and lint. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. Refactor
Tidy with tests green. Commit `refactor(sprint-NN): ...` if anything changed.
