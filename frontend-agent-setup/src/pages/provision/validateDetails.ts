import type { FormError } from "../../components/ErrorSummary";
import type { DirectoryUser } from "../../services/provisioning";
import { mandatoryDetails } from "./userSummary";

/**
 * The retrieved details cannot be edited here, so a missing one blocks the request until
 * it is added to the user's record. The location is the only thing the operator chooses.
 */
export function validateDetails(user: DirectoryUser, location: string): FormError[] {
  const errors: FormError[] = mandatoryDetails
    .filter(({ field }) => !user[field].trim())
    .map(({ key }) => ({
      message: `The user's ${key.toLowerCase()} is missing. It must be added to their record before you can continue.`,
    }));
  if (!location) {
    errors.push({ fieldId: "location", message: "Select a location" });
  }
  return errors;
}
