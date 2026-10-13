import type { FormError } from "../../components/ErrorSummary";
import type { DirectoryUser } from "../../services/provisioning";
import { validateManagerXNumber } from "./managerXNumber";
import { mandatoryDetails } from "./userSummary";

export const managerFieldId = "manager-x-number";
export const locationFieldId = "location";

/**
 * The retrieved details cannot be edited here, so a missing one blocks the request until
 * it is added to the user's record. The operator types the manager's x number (optional)
 * and chooses the location.
 */
/** The names (never the values) of what is missing or wrong, for the UI audit event. */
export function missingFieldNames(user: DirectoryUser, location: string, managerXNumber: string): string[] {
  const missing: string[] = mandatoryDetails.filter(({ field }) => !user[field].trim()).map(({ field }) => field);
  if (validateManagerXNumber(managerXNumber)) {
    missing.push("managerXNumber");
  }
  return location ? missing : [...missing, "location"];
}

export function validateDetails(user: DirectoryUser, location: string, managerXNumber: string): FormError[] {
  const errors: FormError[] = mandatoryDetails
    .filter(({ field }) => !user[field].trim())
    .map(({ name }) => ({
      message: `The user's ${name} is missing. It must be added to their record before you can continue.`,
    }));
  const managerProblem = validateManagerXNumber(managerXNumber);
  if (managerProblem) {
    errors.push({ fieldId: managerFieldId, message: managerProblem });
  }
  if (!location) {
    errors.push({ fieldId: locationFieldId, message: "Select a location" });
  }
  return errors;
}
