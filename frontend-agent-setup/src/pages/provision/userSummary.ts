import type { SummaryItem } from "../../components/SummaryList";
import { getConfig } from "../../config";
import type { DirectoryUser, UserType } from "../../services/provisioning";
import { paths, userTypeLabel } from "./options";

export const notProvided = "Not provided";

/** User type and user number can be changed; the environment cannot. */
export function requestSummary(userType: UserType, userNumber: string): SummaryItem[] {
  return [
    { key: "User type", value: userTypeLabel(userType), changeTo: paths.userType },
    { key: "User number", value: userNumber, changeTo: paths.userNumber },
    { key: "Environment", value: getConfig().environmentName },
  ];
}

export const mandatoryDetails = [
  { field: "firstName", key: "First name" },
  { field: "lastName", key: "Last name" },
  { field: "email", key: "Email address" },
  { field: "jobTitle", key: "Job title" },
] as const;

/** The retrieved details are read-only: they come from the user's record. */
export function userDetailsSummary(user: DirectoryUser): SummaryItem[] {
  return mandatoryDetails.map(({ field, key }) => ({ key, value: user[field].trim() || notProvided }));
}
