// TESTS AND DEVELOPMENT ONLY. Follows the TEMPORARY contract in src/services/provisioning.ts.
import { http, HttpResponse, delay } from "msw";
import { locationsPath, provisioningRequestsPath, userLookupPath } from "../services/provisioning";
import { fakeDirectory, fakeLocations, fakeRequestId } from "./data";

export const handlers = [
  http.get(`*${locationsPath}`, async () => {
    await delay(100);
    return HttpResponse.json(fakeLocations);
  }),
  http.get(`*${userLookupPath}`, async ({ params, request }) => {
    await delay(150);
    const userType = new URL(request.url).searchParams.get("userType");
    const entry = fakeDirectory.find(
      (candidate) => candidate.user.userNumber === params.userNumber && candidate.userType === userType,
    );
    if (!entry) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(entry.user);
  }),
  http.post(`*${provisioningRequestsPath}`, async () => {
    await delay(150);
    return HttpResponse.json({ requestId: fakeRequestId }, { status: 201 });
  }),
];
