import { useCallback } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "../../services/apiClient";
import { recordUiEvent } from "../../services/audit";
import type { UserType } from "../../services/provisioning";

/** The UI audit events for one journey. Events never carry what the operator typed. */
export function journeyAudit<Step extends string>(journey: string, firstStep: Step) {
  return {
    started(): void {
      recordUiEvent({ eventType: "JOURNEY_STARTED", journey, step: firstStep });
    },

    /** Reports the names of the fields that stopped the operator, never what they typed. */
    validationBlocked(step: Step, fields: string[], userType?: string): void {
      recordUiEvent({ eventType: "VALIDATION_BLOCKED", journey, step, fields, userType });
    },

    screenError(step: Step, error: unknown, userType?: string): void {
      const reasonCode = error instanceof ApiError ? `HTTP_${error.status}` : "NO_RESPONSE";
      recordUiEvent({ eventType: "SCREEN_ERROR", journey, step, reasonCode, userType });
    },
  };
}

/** Cancel on any step of any journey: report where the operator stopped, then leave the journey. */
export function useJourneyCancel(journey: string, step: string): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    recordUiEvent({ eventType: "JOURNEY_CANCELLED", journey, step });
    void navigate("/");
  }, [navigate, journey, step]);
}

export type JourneyStep = "user-type" | "user-identifier" | "confirm-user" | "user-details" | "ticket";

const provisioning = journeyAudit<JourneyStep>("provisioning", "user-type");

export function journeyStarted(): void {
  provisioning.started();
}

export function validationBlocked(step: JourneyStep, fields: string[], userType?: UserType): void {
  provisioning.validationBlocked(step, fields, userType);
}

export function screenError(step: JourneyStep, error: unknown, userType?: UserType): void {
  provisioning.screenError(step, error, userType);
}

export function useCancelJourney(step: JourneyStep): () => void {
  return useJourneyCancel("provisioning", step);
}

export type RoleManagerStep = "user-details" | "select-groups" | "review-changes";

export const roleManagerJourney = "role-management";

export const roleManagerAudit = journeyAudit<RoleManagerStep>(roleManagerJourney, "user-details");
