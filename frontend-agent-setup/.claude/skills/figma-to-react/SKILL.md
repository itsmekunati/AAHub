---
name: figma-to-react
description: Turn Figma screenshots or PNG exports into React pages built from Scottish Government Design System components - map each part of the design to a Design System component or existing wrapper, confirm the map, then build test-first through the existing skills and compare the result with the design. Use this whenever the user shares a design, mock-up or screenshot and wants it built.
argument-hint: "<image path(s)> [page or route name]"
---

# Design to React page (screenshots or exports)

Relevant rules: `.claude/rules/design-system.md`, `forms-accessibility.md`, `tdd.md`. The design shows **what** the page needs; the Design System decides **how** it looks. Never reproduce Figma's pixel sizes, colours, fonts or spacing.

## 1. Read the design
- Read every image the user gives. If there is no image, ask for one (a PNG export of each frame, plus error and empty states if they exist).
- Ask for the page name or route and which journey it belongs to, if not given.
- Note anything you cannot read clearly, and ask rather than guess.

## 2. Map, don't copy
Break the design into regions and match each one to a Design System component or pattern from designsystem.gov.scot (page layout, heading, text input, radios, select, error summary, notification banner, table, summary list, tag, pagination, button). Then search `src/components/` for an existing wrapper.

| Design region | Design System component | Wrapper | New or existing |
|---|---|---|---|
| ... | ... | `src/components/...` | ... |

- **Gaps:** where the design has something with no Design System equivalent, or differs from it (custom colours, card layouts, icons, non-standard controls), list it with the nearest Design System option. Never build a custom component without the user's agreement.
- **Data:** list every value the page shows or sends. Find each in `openapi/openapi.json`; a field that is not in the spec is a contract mismatch, not something to invent.
- **States:** the design usually shows only the success state. List the loading, empty, error, `401` and `403` states and validation errors the page also needs.

## 3. Confirm before building
Show the map, the gaps, the data and the states. **Stop and wait for the user to confirm.** Do not write code before that.

## 4. Build test-first through the existing skills
- A new wrapper: `sg-design-system-component`.
- A form or submit flow: `form-with-server-errors`. A list, table or detail view: `data-page`.
- Data from the backend: `add-api-call`.
- Each of these follows `tdd-cycle`: failing tests first, including axe.

## 5. Content
- Plain English, sentence case, the Design System's wording patterns.
- Lorem ipsum, sample names, emails or numbers in the design are placeholders: flag them and never ship them as content or test data from real people.

## 6. Compare with the design
- Run the app against the mock API (`npm run dev`, using the `run` skill) and open the page, in each state the design shows.
- Take a screenshot and compare it with the design, region by region.
- Report: what matches, differences caused by following the Design System (expected), and differences that are real gaps to fix or agree.
