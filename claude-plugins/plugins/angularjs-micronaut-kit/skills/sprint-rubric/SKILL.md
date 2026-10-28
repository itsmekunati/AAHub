---
name: sprint-rubric
description: The shared grading rubric, pass threshold, TDD evidence requirements and bug severity guide for full-stack sprints (AngularJS frontend, Micronaut backend). Use this when self-evaluating a sprint before QA, when evaluating a sprint, or when deciding whether a bug is critical, high, medium or low.
---

# Sprint rubric and severity guide

The Generator uses this for its self-check; the Evaluator uses it to grade. Both must apply it the same way. A dimension that a sprint does not touch (for example accessibility in a backend-only sprint) is scored on what is in scope, and noted as such.

## Dimensions (score 1-10)

| Dimension | What is evaluated |
|---|---|
| **Functionality** | All acceptance criteria met. Backend: correct behaviour on happy and failure paths, correct system of record, clean build and startup. Frontend: loading, empty, error and success states present; server errors handled; lint, tests and build pass. The UI and the API agree on every endpoint used. |
| **Accessibility & Design System** | WCAG 2.2 AA in practice (keyboard, focus, labels, error summary, structure, reflow); zero axe violations; documented Design System markup; no copied or modified Design System files; plain-English, sentence-case content. |
| **Security** | Server-side validation; injection-safe queries; no secrets or unnecessary personal data in code, logs or the bundle; no unsafe HTML (`ng-bind-html` or `$sce.trustAsHtml` with API or user data); server-decided values decided on the server only; least privilege; no permissive CORS. |
| **Craft & TDD** | Test-first evidence for every AC; tests fail when the behaviour is broken. Backend: layering, DTOs at the boundary, constructor injection, compile-time Micronaut APIs (no reflection-only shortcuts), health endpoints, no secrets in logs. Frontend: one component per file, `$http` only in services, user-centred tests with label and role queries, no dead code, E2E updated. No hard-coded configuration. |

## Pass threshold

A sprint passes only if **all** are true:
- every acceptance criterion passes;
- **TDD evidence** exists for every AC (red and green runs recorded, test commit before implementation commit) or a justified `tddExempt`;
- Functionality and Craft & TDD each score **>= 6**;
- Accessibility & Design System scores **>= 8** when the sprint has frontend ACs;
- Security scores **>= 8**;
- no open bug of severity `critical` or `high`, and no WCAG 2.2 A/AA failure in scope.

## Severity guide

| Severity | Examples |
|---|---|
| `critical` | A protected file changed (Claude settings or hooks, `.githooks/`, CI, `deploy/`, merged migrations, the Maven wrapper, `av-ui/package-lock.json` outside `npm install`) or a secret, key or session file added; Snyk switches or `.snyk` ignores changed by an agent; the mock backend (`ngMockE2E`, mock data, scenarios) present in a production build; secret, credential or internal hostname in code, logs or the bundle; XSS risk (unsanitised HTML from API or user data); string-built SQL with user input; touching a real environment or real people's data. |
| `high` | Lint hook failing on the final commit (`bash .githooks/pre-commit --all`); Snyk issues at the blocking level when Snyk is turned on; any WCAG 2.2 A/AA failure; unlabelled field or missing error summary; the UI and the API disagreeing on a path, field or status code; a mock response that the real API never returns; the UI deciding a value the server must decide; a blank screen or unhandled error; raw server messages shown to users; broken or untested failure/compensation path; **missing TDD evidence for an AC; implementation committed before its tests; tests that still pass when the behaviour is deliberately broken; tests deleted, disabled, skipped, focused or weakened.** |
| `medium` | Custom CSS where a Design System class exists; unclear content; missing empty state; weak validation messages; minor layering violations; hard-to-change configuration; tests that query by CSS class where a label or role exists; unclear test names without AC ids. |
| `low` | Naming, small readability issues, minor visual polish, minor test gaps that do not hide behaviour. |

## Self-check before QA (Generator)

Answer each honestly in `self-eval.json`:
- Every AC has red and green evidence and a test commit before its implementation commit.
- `./mvnw clean verify` passes, and frontend lint, tests and build pass.
- Each AC is met.
- Every new endpoint has a `400` test for invalid input and a test for each failure path.
- Validation happens on the server, queries are injection-safe, and the correct system of record is used with no duplication.
- Failure paths are compensated or recorded, and tested.
- All screen states are present, and the accessibility checklist items pass for the screens in scope.
- Design System markup is exact, there is no unsafe HTML, and server-decided values are only displayed.
- The frontend services and mock responses match the endpoints.
- There is no hard-coded configuration, E2E is updated, and there are no CI/CD or `deploy/` changes unless contracted.
