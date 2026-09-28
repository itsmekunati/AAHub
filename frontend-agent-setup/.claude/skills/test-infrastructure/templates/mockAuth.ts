// src/auth/mockAuth.ts: TESTS AND DEVELOPMENT ONLY. Never included in a production build.
import type { AuthClient, Operator, OperatorRole } from "./AuthClient";

export type Persona = "admin" | "editor" | "signed-out" | "session-expiring";

const OPERATORS: Record<Exclude<Persona, "signed-out">, Operator> = {
  admin: { username: "mock.admin", displayName: "Mock Admin", roles: ["admin"] },
  editor: { username: "mock.editor", displayName: "Mock Editor", roles: ["editor"] },
  "session-expiring": { username: "mock.expiring", displayName: "Mock Expiring", roles: ["admin"] },
};

export function createMockAuth(persona: Persona): AuthClient {
  let operator: Operator | null = persona === "signed-out" ? null : OPERATORS[persona];
  const listeners = new Set<() => void>();

  const endSession = () => {
    operator = null;
    listeners.forEach((listener) => listener());
  };

  return {
    async init() {
      if (persona === "session-expiring") setTimeout(endSession, 30_000);
    },
    isAuthenticated: () => operator !== null,
    currentOperator: () => operator,
    hasRole: (role: OperatorRole) => operator?.roles.includes(role) ?? false,
    async login() {
      operator = OPERATORS.admin;
    },
    async logout() {
      endSession();
    },
    async getToken() {
      if (!operator) throw new Error("Not signed in");
      return "mock-token-not-a-jwt";
    },
    onSessionEnd(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
