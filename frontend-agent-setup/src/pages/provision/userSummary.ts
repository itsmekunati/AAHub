import type { SummaryItem } from "../../components/SummaryList";
import { getConfig } from "../../config";
import type { DirectoryUser, UserType } from "../../services/provisioning";
import { paths, userTypeLabel } from "./options";

export const notProvided = "Not provided";

/** User type and user identifier can be changed; the environment cannot. */
export function requestSummary(userType: UserType, userIdentifier: string): SummaryItem[] {
  return [
    { key: "User type", value: userTypeLabel(userType), changeTo: paths.userType },
    { key: "User identifier", value: userIdentifier, changeTo: paths.userIdentifier },
    { key: "Environment", value: getConfig().environmentName },
  ];
}

export const mandatoryDetails = [
  { field: "firstName", key: "First name", name: "first name" },
  { field: "surname", key: "Surname", name: "surname" },
  { field: "email", key: "Email address", name: "email address" },
  { field: "managerXNumber", key: "Manager X number", name: "manager X number" },
  { field: "jobTitle", key: "Job title", name: "job title" },
] as const;

/** The retrieved details are read-only: they come from the user's record. */
export function userDetailsSummary(user: DirectoryUser): SummaryItem[] {
  return mandatoryDetails.map(({ field, key }) => ({ key, value: user[field].trim() || notProvided }));
}
