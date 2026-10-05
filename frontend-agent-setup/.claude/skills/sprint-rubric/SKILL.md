---
name: sprint-rubric
description: The shared grading rubric, pass threshold, TDD evidence requirements and bug severity guide for frontend sprints. Use this when self-evaluating a sprint before QA, when evaluating a sprint, or when deciding whether a bug is critical, high, medium or low.
---

# Sprint rubric and severity guide

The Generator uses this for its self-check; the Evaluator uses it to grade. Both must apply it the same way.

## Dimensions (score 1-10)

| Dimension | What is evaluated |
|---|---|
| **Functionality** | All acceptance criteria met; loading, empty, error and success states present; server errors, `401` and `403` handled; type check, lint, tests and build pass. |
| **Accessibility & Design System** | WCAG 2.2 AA in practice (keyboard, focus, labels, error summary, structure, reflow); zero axe violations; documented Design System markup; no copied or modified Design System files; plain-English, sentence-case content. |
| **Security** | Token in memory only and never logged; PKCE flow; no secrets or environment URLs in the bundle; no unsafe HTML; UI not treated as a security boundary; internal/external classification from the server only. |
| **Craft & TDD** | Test-first evidence for every AC; tests fail when the behaviour is broken; user-centred tests with role/label queries; strict typing with generated types only; API calls in `src/services/`; small focused components; no dead code; E2E updated; no hard-coded configuration. |

## Pass threshold

A sprint passes only if **all** are true:
- every acceptance criterion passes;
- **TDD evidence** exists for every AC (red and green runs recorded, test commit before implementation commit) or a justified `tddExempt`;
- Functionality and Craft & TDD each score **>= 6**;
- Accessibility & Design System scores **>= 8**;
- Security scores **>= 8**;
- no open bug of severity `critical` or `high`, and no WCAG 2.2 A/AA failure in scope.

## Severity guide

| Severity | Examples |
|---|---|
| `critical` | A protected file changed (Claude settings or hooks, `.githooks/`, CI, `deploy/`, the API spec or generated types) or a secret, key or session file added; Snyk switches or `.snyk` ignores changed by an agent; Mock API, mock auth or mock worker script present in a production build; token stored outside memory or logged; secret, credential or internal hostname in the bundle; XSS risk (`dangerouslySetInnerHTML` with API or user data); bypassing or weakening the Okta flow; testing against real environments or real users. |
| `high` | Lint hook failing on the final commit (`bash .githooks/pre-commit --all`); Snyk issues at the blocking level when Snyk is turned on; Any WCAG 2.2 A/AA failure; unlabelled field or missing error summary; hand-written API types or `as` on API data; hand-edited generated files; a mock handler that invents an endpoint, field or status code; the UI deciding or sending user type; a blank screen or unhandled `401`/`403`; raw server messages shown to users; **missing TDD evidence for an AC; implementation committed before its tests; tests that still pass when the behaviour is deliberately broken; tests deleted, skipped or weakened.** |
| `medium` | Custom CSS where a Design System token exists; unclear content; missing empty state; tests that query by CSS class or test ID where a role or label exists; unclear test names without AC ids. |
| `low` | Naming, small readability issues, minor visual polish. |

## Self-check before QA (Generator)

Answer each honestly in `self-eval.json`: every AC has red and green evidence and a test commit before its implementation commit; type check, lint, tests and build pass; generated types match the spec; each AC met; all screen states present; accessibility checklist items for the screens in scope; Design System markup exact; token handling and no logging; no unsafe HTML; user type only displayed; no hard-coded configuration; E2E updated; no CI/CD or `deploy/` changes unless contracted.
