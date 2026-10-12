---
paths:
  - "src/components/**"
  - "src/pages/**"
  - "src/styles/**"
---
# Scottish Government Design System

Reference: https://designsystem.gov.scot and https://github.com/scottish-government-design-system/design-system

- **Install the published package**, `@scottish-government/design-system`, from npm. Do not copy files from the Design System repository into this project and do not modify its output.
- The Design System repository is the library's own source. Its `src/dist/test` layout is **not** a template for this application. Use this project's structure.
- The Design System is plain HTML/CSS/JS, not a React library. Build small React components in `src/components/` that render the Design System's **documented markup and class names exactly**. Check the component's page on designsystem.gov.scot before building it.
- Use existing Design System components (buttons, inputs, error summary, notification banners, tables, etc.) before writing custom ones.
- Avoid custom CSS; use the Design System's Sass and tokens where customisation is needed, in `src/styles/`.
- **Tabs (decided):** `src/components/Tabs.tsx` renders the Design System's dynamic tabs markup and classes but is driven by React state, not the Design System's tabs script, because pages must switch tabs from code (e.g. an error summary link to a field in a hidden tab). It applies the same roles and keyboard behaviour the script would. With `fill`, the tabs share one line on wider screens so the last tab ends where the panel ends; they still wrap or stack when space runs out, so zoom and narrow screens never scroll sideways.
- **Wide pages (decided):** a page whose content must span the whole width (e.g. tabs lined up with a banner) uses `Page layout="full-width"`, which is the Design System's `ds_layout--category-list`. Other pages keep the default article layout.
- **Notification banner icon (decided, from the design):** a black "!" in a white circle instead of the Design System's default orange icon, styled with Design System tokens by `.app_notification__icon--circle` in `src/styles/main.scss`.
- Where a component needs the Design System's JavaScript behaviour, initialise it following the official documentation in a React-safe way: initialise in an effect, clean up on unmount, don't fight React's rendering.

For the step-by-step procedure, use the `sg-design-system-component` skill.
