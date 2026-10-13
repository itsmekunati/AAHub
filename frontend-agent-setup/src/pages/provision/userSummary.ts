import type { SummaryItem } from "../../components/SummaryList";
import { getConfig } from "../../config";
import type { DirectoryUser, UserType } from "../../services/provisioning";
import { paths, userTypeLabel } from "./options";

export const notProvided = "Not provided";

/** User type and user can be changed; the environment cannot. */
export function requestSummary(userType: UserType, userIdentifier: string): SummaryItem[] {
  return [
    { key: "Selected environment", value: getConfig().environmentName },
    { key: "Selected user type", value: userTypeLabel(userType), changeTo: paths.userType },
    { key: "Selected user", value: userIdentifier, changeTo: paths.userIdentifier },
  ];
}

/** The manager's x number is not here: the operator types it, and it may be left blank. */
export const mandatoryDetails = [
  { field: "firstName", key: "First name", name: "first name" },
  { field: "surname", key: "Last name", name: "last name" },
  { field: "email", key: "Email address", name: "email address" },
  { field: "jobTitle", key: "Job title", name: "job title" },
] as const;

/** The retrieved details are read-only: they come from the user's record. */
export function userDetailsSummary(user: DirectoryUser): SummaryItem[] {
  return mandatoryDetails.map(({ field, key }) => ({ key, value: user[field].trim() || notProvided }));
}
