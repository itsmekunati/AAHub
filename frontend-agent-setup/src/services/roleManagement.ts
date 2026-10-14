// TEMPORARY CONTRACT: hand-written until the backend publishes openapi/openapi.json.
// The path and response shape below are placeholders agreed for the mock API only. When the
// spec-sync PR arrives, replace them with the generated ones. Nothing outside src/services/ and
// src/mocks/ should need to change.
import { ApiError, apiFetch } from "./apiClient";

// The user type is the operator's choice. It never decides internal or external: the backend does.
export const ROLE_USER_TYPES = ["SG", "SNH", "FGS", "public"] as const;
export type RoleUserType = (typeof ROLE_USER_TYPES)[number];

export type LdapGroupsResult = { found: true; groups: string[] } | { found: false };

export const ldapGroupsPath = "/users/:userIdentifier/ldap-groups";

function readGroups(body: unknown): string[] {
  const groups: unknown = typeof body === "object" && body !== null ? Reflect.get(body, "groups") : undefined;
  if (!Array.isArray(groups) || !groups.every((group) => typeof group === "string")) {
    throw new Error("Unexpected LDAP groups response");
  }
  return groups;
}

export async function getLdapGroupMemberships(
  userType: RoleUserType,
  userIdentifier: string,
): Promise<LdapGroupsResult> {
  const query = new URLSearchParams({ userType });
  const response = await apiFetch(`/users/${encodeURIComponent(userIdentifier)}/ldap-groups?${query.toString()}`);
  if (response.status === 404) {
    return { found: false };
  }
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return { found: true, groups: readGroups(await response.json()) };
}

export interface LdapGroup {
  id: string;
  name: string;
}

/** One application (one tab) and the LDAP groups an operator can choose for it. */
export interface LdapApplication {
  id: string;
  name: string;
  groups: LdapGroup[];
  /** Set when the user type must keep at least one of this application's groups. The backend decides. */
  minimumGroups?: { message: string };
}

export const ldapGroupCataloguePath = "/ldap-group-catalogue";

function readText(value: unknown, key: string): string {
  const field: unknown = typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;
  if (typeof field !== "string" || !field) {
    throw new Error("Unexpected LDAP group catalogue response");
  }
  return field;
}

function readList(value: unknown, key: string): unknown[] {
  const field: unknown = typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;
  if (!Array.isArray(field)) {
    throw new Error("Unexpected LDAP group catalogue response");
  }
  return field;
}

function toApplication(value: unknown): LdapApplication {
  const rule: unknown = typeof value === "object" && value !== null ? Reflect.get(value, "minimumGroups") : undefined;
  return {
    id: readText(value, "id"),
    name: readText(value, "name"),
    groups: readList(value, "groups").map((group) => ({ id: readText(group, "id"), name: readText(group, "name") })),
    ...(rule === undefined || rule === null ? {} : { minimumGroups: { message: readText(rule, "message") } }),
  };
}

export async function getLdapGroupCatalogue(userType: RoleUserType): Promise<LdapApplication[]> {
  const query = new URLSearchParams({ userType });
  const response = await apiFetch(`${ldapGroupCataloguePath}?${query.toString()}`);
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return readList(await response.json(), "applications").map(toApplication);
}

export const roleChangeRequestsPath = "/role-change-requests";

export interface RoleChangeRequest {
  userType: RoleUserType;
  userIdentifier: string;
  groupsToAdd: string[];
  groupsToRemove: string[];
  /** The mandatory JSM ticket, already in its canonical form (see jiraTicket.ts). */
  jiraTicketId: string;
}

/** The backend could not apply the change (a 5xx response). */
export class RoleChangeFailedError extends ApiError {
  constructor(status: number) {
    super(status);
    this.name = "RoleChangeFailedError";
  }
}

/** The backend's own reference for the change. It is separate from the JSM ticket. */
export async function submitRoleChangeRequest(request: RoleChangeRequest): Promise<{ transactionId: string }> {
  const response = await apiFetch(roleChangeRequestsPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (response.status >= 500) {
    throw new RoleChangeFailedError(response.status);
  }
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  const body: unknown = await response.json();
  const transactionId: unknown =
    typeof body === "object" && body !== null ? Reflect.get(body, "transactionId") : undefined;
  if (typeof transactionId !== "string" || !transactionId) {
    throw new Error("Unexpected role change response");
  }
  return { transactionId };
}
