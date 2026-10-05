import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { loadConfig } from "../config";
import { server } from "../mocks/node";

import { testConfig } from "./testConfig";

beforeAll(async () => {
  server.listen({ onUnhandledRequest: "error" });
  server.use(http.get("*/config.json", () => HttpResponse.json(testConfig)));
  await loadConfig();
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
