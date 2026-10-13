// TESTS AND DEVELOPMENT ONLY. Follows the TEMPORARY contract in src/services/provisioning.ts.
import { http, HttpResponse, delay } from "msw";
import { USER_TYPES, locationsPath, provisioningRequestsPath, userLookupPath } from "../services/provisioning";
import { parseTicketNumber } from "../services/jiraTicket";
import { ldapGroupCataloguePath, ldapGroupsPath, roleChangeRequestsPath } from "../services/roleManagement";
import {
  fakeDirectory,
  fakeLdapCatalogue,
  fakeLdapMemberships,
  fakeLocations,
  fakeProvisionedXNumber,
  fakeRoleChangeTransactionId,
  fakeTransactionId,
} from "./data";

// Every field is mandatory on a provisioning request, including the JSM/Jira ticket.
const mandatoryRequestFields = [
  "userType",
  "userIdentifier",
  "firstName",
  "surname",
  "email",
  "managerXNumber",
  "jobTitle",
  "location",
  "jiraTicketId",
];

function isComplete(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    mandatoryRequestFields.every((field) => {
      const value: unknown = Reflect.get(body, field);
      return typeof value === "string" && value.trim() !== "";
    })
  );
}

function isNonEmptyList(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

// A role change needs the user, at least one group to add or remove, and a ticket in the canonical form.
function isCompleteRoleChange(body: unknown): boolean {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const userIdentifier: unknown = Reflect.get(body, "userIdentifier");
  const jiraTicketId: unknown = Reflect.get(body, "jiraTicketId");
  const ticket = parseTicketNumber(typeof jiraTicketId === "string" ? jiraTicketId : "");
  return (
    typeof userIdentifier === "string" &&
    userIdentifier.trim() !== "" &&
    ticket.ok &&
    ticket.ticketId === jiraTicketId &&
    (isNonEmptyList(Reflect.get(body, "groupsToAdd")) || isNonEmptyList(Reflect.get(body, "groupsToRemove")))
  );
}

export const handlers = [
  http.post(`*${roleChangeRequestsPath}`, async ({ request }) => {
    await delay(150);
    if (!isCompleteRoleChange(await request.json())) {
      return new HttpResponse(null, { status: 400 });
    }
    return HttpResponse.json({ transactionId: fakeRoleChangeTransactionId }, { status: 201 });
  }),
  http.get(`*${ldapGroupCataloguePath}`, async ({ request }) => {
    await delay(100);
    const userType = new URL(request.url).searchParams.get("userType");
    return HttpResponse.json({ applications: fakeLdapCatalogue(userType) });
  }),
  http.get(`*${ldapGroupsPath}`, async ({ params, request }) => {
    await delay(150);
    const userType = new URL(request.url).searchParams.get("userType");
    const identifier = String(params.userIdentifier).toLowerCase();
    const entry = fakeLdapMemberships.find(
      (candidate) => candidate.userIdentifier === identifier && candidate.userType === userType,
    );
    if (!entry) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ groups: entry.groups });
  }),
  http.get(`*${locationsPath}`, async ({ request }) => {
    await delay(100);
    const requested = new URL(request.url).searchParams.get("userType");
    const userType = USER_TYPES.find((candidate) => candidate === requested);
    if (!userType) {
      return new HttpResponse(null, { status: 400 });
    }
    return HttpResponse.json(fakeLocations[userType]);
  }),
  http.get(`*${userLookupPath}`, async ({ params, request }) => {
    await delay(150);
    const userType = new URL(request.url).searchParams.get("userType");
    // The operator may type the identifier's letters in either case.
    const userIdentifier = String(params.userIdentifier).toUpperCase();
    const entry = fakeDirectory.find(
      (candidate) => candidate.user.userIdentifier.toUpperCase() === userIdentifier && candidate.userType === userType,
    );
    if (!entry) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(entry.user);
  }),
  http.post(`*${provisioningRequestsPath}`, async ({ request }) => {
    await delay(150);
    if (!isComplete(await request.json())) {
      return new HttpResponse(null, { status: 400 });
    }
    return HttpResponse.json({ transactionId: fakeTransactionId, userXNumber: fakeProvisionedXNumber }, { status: 201 });
  }),
];
