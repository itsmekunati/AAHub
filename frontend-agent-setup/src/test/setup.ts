import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { loadConfig } from "../config";
import { server } from "../mocks/node";

const testConfig = http.get("*/config.json", () =>
  HttpResponse.json({ apiBaseUrl: "/api", environmentName: "Test environment" }),
);

beforeAll(async () => {
  server.listen({ onUnhandledRequest: "error" });
  server.use(testConfig);
  await loadConfig();
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
