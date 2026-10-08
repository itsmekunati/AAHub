// src/mocks/data.ts: TESTS AND DEVELOPMENT ONLY. Typed fake data built from the generated API types.
// Fake values only (example.test, obviously fake names). Server-decided values are set here as the
// BACKEND would return them; UI code never works them out.
import type { paths } from "../services/api/generated/schema"; // VERIFY: generated file name

// PLACEHOLDER operation: replace with real operations from openapi/openapi.json. Never invent one.
type CreateUserRequest =
  paths["/VERIFY/users"]["post"]["requestBody"]["content"]["application/json"];
type CreateUserResponse =
  paths["/VERIFY/users"]["post"]["responses"]["201"]["content"]["application/json"];

export function fakeCreatedUser(request: CreateUserRequest): CreateUserResponse {
  // VERIFY: return every required field of the generated response type; the type checker
  // rejects anything missing or misspelled, so no `as` casts are needed.
  return {
    ...request,
  };
}
