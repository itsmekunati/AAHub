---
paths:
  - "src/services/**"
  - "openapi/**"
---
# API contract and generated client

- **The backend owns the API contract**, published as `openapi/openapi.json`. Do not guess endpoint paths, request fields, response shapes, status codes or error formats. If something is not in the spec, ask.
- **Types and the API client are generated from that spec.** Never write API types by hand.
- The spec is kept current **automatically**: when the backend's contract changes, its CI opens a **pull request** in this repo with the updated spec and regenerated types (`src/services/api/generated/`). Review and merge it like any other change, and treat it as the signal to check whether the UI needs updating.
- Never hand-edit `openapi/openapi.json` or anything under `src/services/api/generated/`; both are overwritten by the sync PR.
- For local development against a locally running backend, `npm run api:update` fetches the spec from it (e.g. `http://localhost:8080/v3/api-docs`) and `npm run api:generate` regenerates the types. **Revert those local-only changes before committing** unless they came from a real sync PR.
- CI regenerates the types and diffs them against the committed spec, so the two cannot drift.
- Keep **all API calls in `src/services/`**, so a contract change is fixed in one place.
- The backend is deployed separately, so a backend change can break the UI without any test here failing. Handle unexpected responses gracefully and surface any contract mismatch you notice.
- **User type (internal or external) is decided by the backend** from the email domain. Never decide it, send it, or duplicate the domain rules. Display what the server returns.
- Do not use `as` to force API data into a shape; use the generated types and narrow `unknown`.

For the step-by-step procedures, use the `add-api-call` and `assess-spec-sync-pr` skills.
