import { createContext, useContext, type ReactNode } from "react";
import { currentOperatorRole, type OperatorRole } from "./operator";

// The signed-in operator's role, for deciding what to show. Tests set it with the provider; the
// app falls back to the placeholder until Okta sign-in replaces it.
const OperatorRoleContext = createContext<OperatorRole | undefined>(undefined);

export function OperatorRoleProvider({ role, children }: { role: OperatorRole; children: ReactNode }) {
  return <OperatorRoleContext.Provider value={role}>{children}</OperatorRoleContext.Provider>;
}

export function useOperatorRole(): OperatorRole {
  return useContext(OperatorRoleContext) ?? currentOperatorRole();
}
