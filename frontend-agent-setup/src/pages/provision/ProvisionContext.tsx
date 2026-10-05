import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { DirectoryUser, UserType } from "../../services/provisioning";

export type SubmissionOutcome = { succeeded: true; transactionId: string } | { succeeded: false; reason: string };

export interface ProvisionState {
  userType?: UserType;
  userIdentifier: string;
  /** The user returned by the lookup; set only once the user identifier has been validated. */
  user?: DirectoryUser;
  location?: string;
  ticketId: string;
  outcome?: SubmissionOutcome;
}

interface ProvisionContextValue {
  state: ProvisionState;
  chooseUserType: (userType: UserType) => void;
  userValidated: (userIdentifier: string, user: DirectoryUser) => void;
  chooseLocation: (location: string) => void;
  submissionFinished: (ticketId: string, outcome: SubmissionOutcome) => void;
}

const ProvisionContext = createContext<ProvisionContextValue | undefined>(undefined);

const initialState: ProvisionState = { userIdentifier: "", ticketId: "" };

/** Holds the journey's answers. It lives only while the operator is inside /provision. */
export function ProvisionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProvisionState>(initialState);

  const value = useMemo<ProvisionContextValue>(
    () => ({
      state,
      chooseUserType: (userType) =>
        setState((current) =>
          current.userType === userType ? current : { ...initialState, userIdentifier: current.userIdentifier, userType },
        ),
      userValidated: (userIdentifier, user) =>
        setState((current) => ({
          ...current,
          userIdentifier,
          user,
          location: current.user?.userIdentifier === user.userIdentifier ? current.location : undefined,
        })),
      chooseLocation: (location) => setState((current) => ({ ...current, location })),
      submissionFinished: (ticketId, outcome) => setState((current) => ({ ...current, ticketId, outcome })),
    }),
    [state],
  );

  return <ProvisionContext value={value}>{children}</ProvisionContext>;
}

export function useProvision(): ProvisionContextValue {
  const value = useContext(ProvisionContext);
  if (!value) {
    throw new Error("useProvision must be used inside ProvisionProvider");
  }
  return value;
}
