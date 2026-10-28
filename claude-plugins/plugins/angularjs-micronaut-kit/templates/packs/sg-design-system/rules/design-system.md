---
paths:
  - "av-ui/src/app/**"
  - "av-ui/src/styles/**"
---
# Scottish Government Design System

Reference: https://designsystem.gov.scot and https://github.com/scottish-government-design-system/design-system

- **Install the published package**, `@scottish-government/design-system`, from npm in `av-ui/`. Do not copy files from the Design System repository into this project and do not modify its output.
- The Design System repository is the library's own source. Its `src/dist/test` layout is **not** a template for this application. Use this project's structure.
- The Design System is plain HTML/CSS/JS, which suits AngularJS templates well. Build small AngularJS components in `av-ui/src/app/components/` whose templates render the Design System's **documented markup and class names exactly**. Check the component's page on designsystem.gov.scot before building it.
- Use existing Design System components (buttons, inputs, error summary, notification banners, tables, etc.) before writing custom ones.
- Avoid custom CSS; use the Design System's Sass and tokens where customisation is needed, in `av-ui/src/styles/`.
- Where a component needs the Design System's JavaScript behaviour, initialise it following the official documentation in an AngularJS-safe way: in the component's `$postLink` (the element is in the DOM by then), and clean up in `$onDestroy`.

For the step-by-step procedure, use the `sg-design-system-component` skill.
