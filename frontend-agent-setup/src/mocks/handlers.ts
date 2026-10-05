// TESTS AND DEVELOPMENT ONLY. Follows the TEMPORARY contract in src/services/provisioning.ts.
import { http, HttpResponse, delay } from "msw";
import { locationsPath, provisioningRequestsPath, userLookupPath } from "../services/provisioning";
import { fakeDirectory, fakeLocations, fakeTransactionId } from "./data";

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

export const handlers = [
  http.get(`*${locationsPath}`, async () => {
    await delay(100);
    return HttpResponse.json(fakeLocations);
  }),
  http.get(`*${userLookupPath}`, async ({ params, request }) => {
    await delay(150);
    const userType = new URL(request.url).searchParams.get("userType");
    const entry = fakeDirectory.find(
      (candidate) => candidate.user.userIdentifier === params.userIdentifier && candidate.userType === userType,
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
    return HttpResponse.json({ transactionId: fakeTransactionId }, { status: 201 });
  }),
];
