// TESTS ONLY: mock API server.
import { setupServer } from "msw/node";
import { auditHandlers } from "./auditHandlers";
import { handlers } from "./handlers";

export const server = setupServer(...handlers, ...auditHandlers);
