// src/test/setup.ts: runs before every test file. VERIFY imports for the chosen test runner.
import "@testing-library/jest-dom";
import { server } from "../mocks/node";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
