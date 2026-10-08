// src/mocks/handlers.ts: TESTS AND DEVELOPMENT ONLY. Assumes MSW (docs/open-questions.md #7).
// Every path, method and shape MUST come from openapi/openapi.json via the generated types.
import { http, HttpResponse, delay } from "msw";
import type { paths } from "../services/api/generated/schema"; // VERIFY: generated file name
import { fakeCreatedUser } from "./data";

type CreateUserRequest =
  paths["/VERIFY/users"]["post"]["requestBody"]["content"]["application/json"];
type CreateUserResponse =
  paths["/VERIFY/users"]["post"]["responses"]["201"]["content"]["application/json"];

const USERS = "*/VERIFY/users"; // PLACEHOLDER: match any base URL

export const handlers = [
  http.post<never, CreateUserRequest, CreateUserResponse>(USERS, async ({ request }) => {
    const body = await request.json();
    await delay(150);
    const created: CreateUserResponse = fakeCreatedUser(body);
    return HttpResponse.json(created, { status: 201 });
  }),
];
