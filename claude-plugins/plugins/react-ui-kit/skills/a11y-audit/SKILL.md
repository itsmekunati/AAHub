---
name: a11y-audit
description: Read-only accessibility audit of the running UI in a real browser against the mock API - axe, keyboard and focus, structure, page titles and reflow on every route and its error scenarios - reported against docs/reference/accessibility-checklist.md with sprint-rubric severities. Preloaded into the Evaluator. Use this when evaluating a sprint, when someone asks for an accessibility check of the app, before a release, or after a change to several pages.
argument-hint: "[route(s), default all]"
---

# Accessibility audit of the running UI

Relevant rules: `.claude/rules/forms-accessibility.md`, and `design-system.md` if the project has it. Checklist: `docs/reference/accessibility-checklist.md`. Read-only: report, change nothing.

**Browser tools:** use the ones you have. The Evaluator has this plugin's Playwright MCP server (`browser_navigate`, `browser_snapshot`, `browser_press_key`, `browser_evaluate`, `browser_resize`, `browser_take_screenshot`). A normal session has `claude-in-chrome` (`navigate`, `read_page`, `computer`, `javascript_tool`, `read_console_messages`, `resize_window`, `gif_creator`); load them in one ToolSearch call.

## 1. The app and what to cover
- If the app is already running (the Evaluator starts it), use it. Otherwise run `npm run dev` in the background (mock API; never `dev:api` or a real environment) and note the URL.
- Routes: the argument, the screens in the sprint contract (Evaluator), or every route in the app's route definitions, including the not-found page.
- Scenarios: `success` for every route, plus each scenario in `src/mocks/scenarios.ts` that affects that page (for example a server error or a forbidden response on a page that loads data, and a failed submit on a form). Pick one with `?scenario=<name>` on the **first** page load; start a fresh page to change it.
- Reach later journey steps by completing the earlier ones with valid mock data, as a user would.
- Roles: when mock auth and personas (one per role) exist, repeat for each and check hidden actions are not focusable. Until then, report roles as **not built**.

## 2. On each page and state
- **axe:** run this in the page (`browser_evaluate` or `javascript_tool`). It loads the `axe-core` copy the dev server serves, so nothing comes from a CDN:
  ```js
  async () => {
    if (!window.axe) await new Promise((ok, err) => { const s = document.createElement("script"); s.src = "/node_modules/axe-core/axe.min.js"; s.onload = ok; s.onerror = err; document.head.append(s); });
    const r = await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] });
    const out = r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }));
    console.log("[a11y]", JSON.stringify(out));
    return out;
  }
  ```
  Use the returned value; if the tool does not return it, read the console for `[a11y]`. If the script does not load, report it and continue with the manual checks.
- **Keyboard:** Tab from the top: the skip link appears and works; focus order follows the visual order; focus is always visible; everything works without a mouse; no keyboard trap.
- **Errors (forms):** submit empty or invalid: the error summary appears and takes focus, each link moves focus to its field, inline errors match, and the page title starts with "Error: ".
- **Structure:** one `h1`, headings in order, landmarks present, the page title matches the page and changes on navigation, and focus moves to the `h1` after navigation.
- **States:** loading is announced; errors use the design system's notification component; never a blank screen or raw server text.
- **Reflow:** resize to 320 px wide: no horizontal scrolling and nothing cut off. Repeat at 200% zoom (or 640 px wide as the equivalent).

## 3. Evidence
Record one keyboard journey through the main flow with `gif_creator` when it is available (frames before and after each step, named `a11y-audit-<journey>.gif`); otherwise take a screenshot of each failure.

## 4. Report
- For each page: the result against each section of the checklist (Keyboard, Structure, Forms, Visual, Dynamic content, Content, Automated).
- Each finding: severity from the `react-ui-kit:sprint-rubric` skill (any WCAG 2.2 A/AA failure is `high`), page and state, what fails, the WCAG criterion, the likely file in `src/`, and a suggested fix.
- What could not be checked here (for example screen reader announcements) and needs a manual screen reader pass.
- **When run by the Evaluator:** record the results in the evaluation file's `accessibility` field and each finding in `bugs`, with page, file, steps and WCAG criterion.
- Stop the dev server only if this skill started it.
