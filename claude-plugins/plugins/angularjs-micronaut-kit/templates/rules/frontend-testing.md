---
paths:
  - "av-ui/src/**/*.spec.js"
  - "av-ui/src/mocks/**"
  - "av-ui/test/**"
  - "av-ui/karma.conf.*"
---
# Frontend testing

Shared test helpers (`compileComponent`, `$httpBackend` scenarios, axe helper, fake data, the dev mock backend) are built and used with the `angularjs-micronaut-kit:ui-test-infrastructure` skill. All tests are written **before** the code they cover (see `.claude/rules/tdd.md` and the `angularjs-micronaut-kit:tdd-cycle` skill). This file says **what** must be tested; `tdd.md` says **when and how**.

- Karma + Jasmine + `angular-mocks`. Spec files sit next to the code they test (`*.spec.js`).
- Test form validation and error states, including server validation errors shown as inline errors plus the error summary.
- Test loading, empty, error and success states.
- Include automated accessibility checks (axe) for components under test.
- Find elements by label text, role and visible text rather than CSS classes or scope internals.
- Mock the API with `$httpBackend` using the shared scenarios in `av-ui/src/mocks/scenarios.js`; never call a real backend. Unmatched requests fail the test; call `verifyNoOutstandingExpectation()` and `verifyNoOutstandingRequest()` in `afterEach`.
- Mock responses must match the backend's DTOs and error shape exactly. When an endpoint changes, the scenarios change in the same sprint.
- **Mock mode:** the dev server can run the UI against the same scenarios through the `mockBackend` module (`ngMockE2E`). Pick a scenario by adding `?scenario=<name>` to the first page load.
