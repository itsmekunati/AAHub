// src/mocks/node.ts: mock server for tests only.
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
