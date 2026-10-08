---
paths:
  - "src/main/java/**/api/**"
  - "src/main/java/**/exception/**"
---
# API contract and the frontend repository

**This repo owns the API contract, and the contract is an OpenAPI spec generated from the code (code-first).**

- Use **springdoc-openapi 3.x** (the line for Spring Boot 4). Document controllers and DTOs with OpenAPI annotations where the generated spec would otherwise be unclear: descriptions, error responses, required fields, allowed roles.
- `openapi.json` is generated at build time in CI (the springdoc Maven plugin runs during the integration-test phase). On merge to `main`, a **spec-sync workflow** triggers the frontend repo (via `repository_dispatch`, using a GitHub App or fine-grained PAT with access to only that repo), which regenerates its TypeScript types and opens a **pull request** with the updated spec and types. Nothing lands in the frontend's `main` without that PR being reviewed.
- Never hand-edit the generated spec. Change the code and regenerate it.
- The Swagger/Scalar UI is for development only. Disable it, and the public docs endpoints, outside development environments unless agreed.
- The frontend is deployed separately, so a breaking change (renamed or removed fields, changed status codes, changed error shape, changed validation rules) will not fail any test here but will break the UI later. **Flag every breaking change explicitly** and prefer backward-compatible changes (add fields; don't rename or remove them).
- Keep the error response shape consistent and documented; the UI maps it to its error messages.
- Do not guess what the UI sends or expects. If a task depends on frontend behaviour, ask for the relevant request/response or frontend code.
- Whether the UI and API share an origin through OpenShift routing (and so whether CORS is needed) is still open: see `docs/open-questions.md`.

For the step-by-step procedure, use the `springboot-api-kit:add-endpoint` skill. To check a change for breaking changes, use the `springboot-api-kit:api-contract-diff` skill.
