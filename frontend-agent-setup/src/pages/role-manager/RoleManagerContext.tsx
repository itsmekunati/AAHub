import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { LdapApplication, RoleUserType } from "../../services/roleManagement";

export interface RoleManagerState {
  userType: RoleUserType;
  userIdentifier: string;
  /** The applications and groups the operator can choose from; set once the backend has found the user. */
  catalogue?: LdapApplication[];
  /** The ids of the groups the user is in now, as the backend returned them. */
  memberships?: string[];
  /** The ids of the groups the operator has chosen; starts as a copy of `memberships`. */
  selected?: string[];
  /** Set once the backend has accepted the change. Its presence stops a second submission. */
  submitted?: { transactionId: string; ticketId: string };
  /** Set when the backend could not apply the change. */
  failed?: true;
}

interface RoleManagerContextValue {
  state: RoleManagerState;
  groupsFound: (
    userType: RoleUserType,
    userIdentifier: string,
    memberships: string[],
    catalogue: LdapApplication[],
  ) => void;
  groupsSelected: (selected: string[]) => void;
  changesSubmitted: (transactionId: string, ticketId: string) => void;
  changeFailed: () => void;
}

const RoleManagerContext = createContext<RoleManagerContextValue | undefined>(undefined);

const initialState: RoleManagerState = { userType: "SG", userIdentifier: "" };

/** Holds the journey's answers. It lives only while the operator is inside /role-manager. */
export function RoleManagerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RoleManagerState>(initialState);

  const value = useMemo<RoleManagerContextValue>(
    () => ({
      state,
      groupsFound: (userType, userIdentifier, memberships, catalogue) =>
        setState({ userType, userIdentifier, catalogue, memberships, selected: memberships }),
      groupsSelected: (selected) => setState((current) => ({ ...current, selected })),
      changesSubmitted: (transactionId, ticketId) =>
        setState((current) => ({ ...current, submitted: { transactionId, ticketId } })),
      changeFailed: () => setState((current) => ({ ...current, failed: true })),
    }),
    [state],
  );

  return <RoleManagerContext value={value}>{children}</RoleManagerContext>;
}

export function useRoleManager(): RoleManagerContextValue {
  const value = useContext(RoleManagerContext);
  if (!value) {
    throw new Error("useRoleManager must be used inside RoleManagerProvider");
  }
  return value;
}
