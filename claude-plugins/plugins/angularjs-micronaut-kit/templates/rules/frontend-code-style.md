---
paths:
  - "av-ui/src/**/*.js"
  - "av-ui/src/**/*.html"
  - "av-ui/e2e/**"
  - "av-ui/package.json"
  - "av-ui/eslint.config.*"
---
# AngularJS conventions

<!-- SETUP: record the AngularJS version (1.7.x / 1.8.x), the router (ngRoute or ui-router) and the build tool (webpack, gulp, or plain script tags). -->
- This UI is **AngularJS 1.x** (`angular.module`), not Angular 2+. Online material for "Angular" usually means Angular 2+; check that an example is AngularJS before using it.
- Small, focused components and services. Meaningful names. No dead code or commented-out code.
- **Components, not controllers on templates:** build every view as an `angular.module(...).component()` with `controllerAs: '$ctrl'`, one-way (`<`) and callback (`&`) bindings, and lifecycle hooks (`$onInit`, `$onChanges`, `$onDestroy`). No `ng-controller`, no `$scope` inheritance, no two-way (`=`) bindings for new code.
- One component, service or module per file, named to match (`create-record.component.js`, `records.service.js`). Each feature folder under `av-ui/src/app/` has its own module.
- Use the explicit array (or `$inject`) annotation for every injectable, so minification does not break dependency injection.
- **All `$http` calls live in services in `av-ui/src/app/services/`**, never in components. Services return promises of small result objects the component switches on.
- The API base URL comes from the runtime configuration (see `runtime-config.md`), never a hard-coded host.
- Bind text with `{{ }}` or `ng-bind`. Never `ng-bind-html` with API or user data, and never `$sce.trustAsHtml` on it.
- `track by` on every `ng-repeat`; no expensive functions in watched expressions.
- ESLint with the configuration committed in this repo (with `eslint-plugin-angular` if the team adopts it). Do not introduce a competing style.
- Handle loading, empty and error states for every data-driven screen.
- Do not add dependencies without a clear reason; ask first for major ones.
