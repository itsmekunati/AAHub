import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { DirectoryUser, UserType } from "../../services/provisioning";

export type SubmissionOutcome = { succeeded: true; userXNumber?: string } | { succeeded: false; reason: string };

/** All the result page shows. Nothing else from the journey is kept once a result exists. */
export interface SubmissionResult {
  outcome: SubmissionOutcome;
  userTypeLabel: string;
  fullName: string;
}

export interface ProvisionState {
  userType?: UserType;
  userIdentifier: string;
  /** The user returned by the lookup; set only once the user identifier has been validated. */
  user?: DirectoryUser;
  /** What the operator typed; empty when they left it blank. */
  managerXNumber?: string;
  location?: string;
  result?: SubmissionResult;
}

interface ProvisionContextValue {
  state: ProvisionState;
  chooseUserType: (userType: UserType) => void;
  userValidated: (userIdentifier: string, user: DirectoryUser) => void;
  detailsCompleted: (managerXNumber: string, location: string) => void;
  submissionFinished: (result: SubmissionResult) => void;
}

const ProvisionContext = createContext<ProvisionContextValue | undefined>(undefined);

const initialState: ProvisionState = { userIdentifier: "" };

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
        setState((current) => {
          const sameUser = current.user?.userIdentifier === user.userIdentifier;
          return {
            ...current,
            userIdentifier,
            user,
            managerXNumber: sameUser ? current.managerXNumber : undefined,
            location: sameUser ? current.location : undefined,
          };
        }),
      detailsCompleted: (managerXNumber, location) => setState((current) => ({ ...current, managerXNumber, location })),
      // The answers are discarded with the result: the browser's Back button must not bring them back.
      submissionFinished: (result) => setState({ ...initialState, result }),
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
