---
name: add-api-call
description: Test-first procedure for calling a backend API operation from the UI using only the generated OpenAPI types and client in src/services/, with the token attached centrally and every response (success, validation error, 401, 403, other errors, unexpected shape) handled. Use this whenever you add, change or remove any call to the backend.
---

# Add a backend API call (test-first)

Relevant rules: `.claude/rules/tdd.md`, `api-client.md`, `code-style.md`, and `auth.md` if the project has it. Follow the `react-ui-kit:tdd-cycle` skill.

## 1. Find the operation in the spec
- Look it up in `openapi/openapi.json`: path, method, request body, responses and error shape.
- If it, or a field you need, is not there, **stop**: report a contract mismatch. Never guess or add types by hand.

## 2. Red: write the failing service tests first
Add a stub service function that throws, then write tests (mocking the generated client or HTTP layer, using generated types) that assert each outcome maps to a typed result:
- `success` with the generated response type;
- `validationError` with field errors mapped from the documented error shape;
- `unauthorised` (`401`);
- `forbidden` (`403`);
- `error` for anything else (network failure, `5xx`, unexpected shape), with no raw server text;
- no request or response bodies, tokens or personal data are logged.

Run them, confirm they fail for the right reason, record the red evidence, and commit `test(sprint-NN): ACn failing tests`.

## 3. Green: use the generated client
- Import types and the client from `src/services/api/generated/`. Never edit that folder.
- Put the call in a function in `src/services/` (one module per resource). Components never call the API directly.
- The Bearer token is attached by the shared client set-up in `src/services/`. Do not attach it again, read it, or log it.
- Narrow unknown data; never use `as` to force a shape.

Run until green, then the full suite, type check and lint. Commit `feat(sprint-NN): <feature> - implement ACn`.

## 4. Refactor
Tidy with tests green.
