import { useCallback } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "../../services/apiClient";
import { recordUiEvent } from "../../services/audit";
import type { UserType } from "../../services/provisioning";

const journey = "provisioning";

export type JourneyStep = "user-type" | "user-identifier" | "confirm-user" | "user-details" | "ticket";

export function journeyStarted(): void {
  recordUiEvent({ eventType: "JOURNEY_STARTED", journey, step: "user-type" });
}

/** Reports the names of the fields that stopped the operator, never what they typed. */
export function validationBlocked(step: JourneyStep, fields: string[], userType?: UserType): void {
  recordUiEvent({ eventType: "VALIDATION_BLOCKED", journey, step, fields, userType });
}

export function screenError(step: JourneyStep, error: unknown, userType?: UserType): void {
  const reasonCode = error instanceof ApiError ? `HTTP_${error.status}` : "NO_RESPONSE";
  recordUiEvent({ eventType: "SCREEN_ERROR", journey, step, reasonCode, userType });
}

/** Cancel on any step: report where the operator stopped, then leave the journey. */
export function useCancelJourney(step: JourneyStep): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    recordUiEvent({ eventType: "JOURNEY_CANCELLED", journey, step });
    void navigate("/");
  }, [navigate, step]);
}
