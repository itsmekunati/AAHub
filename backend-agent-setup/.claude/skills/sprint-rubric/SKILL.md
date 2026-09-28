---
name: sprint-rubric
description: The shared grading rubric, pass threshold, TDD evidence requirements and bug severity guide for backend sprints. Use this when self-evaluating a sprint before QA, when evaluating a sprint, or when deciding whether a bug is critical, high, medium or low.
---

# Sprint rubric and severity guide

The Generator uses this for its self-check; the Evaluator uses it to grade. Both must apply it the same way.

## Dimensions (score 1-10)

| Dimension | What is evaluated |
|---|---|
| **Functionality** | All acceptance criteria met; correct behaviour on happy and failure paths; correct system of record; clean build and startup. |
| **Security** | Deny by default; correct `401`/`403`; no privilege escalation; operator identity only from the JWT; server-side validation and classification; injection-safe LDAP/SQL; no secrets or unnecessary personal data in code or logs; least privilege; no permissive CORS. |
| **Audit & Observability** | Every required event audited for success and failure; single-line JSON; all mandatory fields; MDC and correlation ID propagation; infrastructure failures audited; Logback rolling policy; correct Actuator health endpoints. |
| **Craft & TDD** | Test-first evidence for every AC; tests fail when the behaviour is broken; layering; DTOs at the boundary; constructor injection; small focused classes; Spring Boot 4 / Jackson 3 APIs; no hard-coded configuration; clear OpenAPI docs; breaking changes flagged. |

## Pass threshold

A sprint passes only if **all** are true:
- every acceptance criterion passes;
- **TDD evidence** exists for every AC (red and green runs recorded, test commit before implementation commit) or a justified `tddExempt`;
- Functionality, Audit & Observability and Craft & TDD each score **>= 6**;
- Security scores **>= 8**;
- no open bug of severity `critical` or `high`.

## Severity guide

| Severity | Examples |
|---|---|
| `critical` | A protected file changed (Claude settings or hooks, `.githooks/`, CI, `deploy/`, merged migrations) or a secret, key or session file added; Snyk switches or `.snyk` ignores changed by an agent; Security bypass or public endpoint; secret, credential or token exposed in code or logs; operator identity taken from the request; touching a real environment. |
| `high` | Lint hook failing on the final commit (`bash .githooks/pre-commit --all`); Snyk issues at the blocking level when Snyk is turned on; Missing audit record on a required event; missing mandatory audit field; broken or untested failure/compensation path; unflagged breaking API change; string-built LDAP filter or SQL; missing `401`/`403` tests; **missing TDD evidence for an AC; implementation committed before its tests; tests that still pass when the behaviour is deliberately broken; tests deleted, disabled or weakened.** |
| `medium` | Missing or unclear OpenAPI documentation; weak validation messages; minor layering violations; hard-to-change configuration; unclear test names without AC ids. |
| `low` | Naming, small readability issues, minor test gaps that do not hide behaviour. |

## Self-check before QA (Generator)

Answer each honestly in `self-eval.json`: every AC has red and green evidence and a test commit before its implementation commit; build passes; each AC met; `401`/`403`/success tested for every new endpoint; validation and classification server-side; correct system of record, no duplication, injection-safe; failure path compensated or recorded and tested; audit on success and failure with all fields and no secrets; no hard-coded configuration; Boot 4 / Jackson 3 APIs; API changes flagged; no CI/CD or `deploy/` changes unless contracted.
