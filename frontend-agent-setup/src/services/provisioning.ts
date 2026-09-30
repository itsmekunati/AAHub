// TEMPORARY CONTRACT: hand-written until the backend publishes openapi/openapi.json.
// When the spec-sync PR arrives, replace these types with the generated ones and update
// the paths below. Nothing outside src/services/ and src/mocks/ should need to change.
import { ApiError, apiFetch } from "./apiClient";

export const USER_TYPES = ["government", "forestry", "nature"] as const;
export type UserType = (typeof USER_TYPES)[number];

export interface DirectoryUser {
  userNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
}

export interface ProvisioningRequest {
  userType: UserType;
  userNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  location: string;
  jiraTicketId: string;
}

export interface ProvisioningRequestCreated {
  requestId: string;
}

export type UserLookupResult = { found: true; user: DirectoryUser } | { found: false };

export const userLookupPath = "/users/:userNumber";
export const provisioningRequestsPath = "/provisioning-requests";
export const locationsPath = "/locations";

export async function getLocations(): Promise<string[]> {
  const response = await apiFetch(locationsPath);
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  const body: unknown = await response.json();
  if (!Array.isArray(body) || !body.every((item) => typeof item === "string")) {
    throw new Error("Unexpected locations response");
  }
  return body;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: Record<string, unknown>, key: string): string {
  const field = value[key];
  return typeof field === "string" ? field : "";
}

function toDirectoryUser(value: unknown): DirectoryUser {
  if (!isRecord(value)) {
    throw new Error("Unexpected user lookup response");
  }
  return {
    userNumber: readString(value, "userNumber"),
    firstName: readString(value, "firstName"),
    lastName: readString(value, "lastName"),
    email: readString(value, "email"),
    jobTitle: readString(value, "jobTitle"),
  };
}

export async function lookUpUser(userType: UserType, userNumber: string): Promise<UserLookupResult> {
  const query = new URLSearchParams({ userType });
  const response = await apiFetch(`/users/${encodeURIComponent(userNumber)}?${query.toString()}`);
  if (response.status === 404) {
    return { found: false };
  }
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return { found: true, user: toDirectoryUser(await response.json()) };
}

export async function submitProvisioningRequest(
  request: ProvisioningRequest,
): Promise<ProvisioningRequestCreated> {
  const response = await apiFetch(provisioningRequestsPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  const body: unknown = await response.json();
  if (!isRecord(body) || typeof body.requestId !== "string") {
    throw new Error("Unexpected provisioning response");
  }
  return { requestId: body.requestId };
}
