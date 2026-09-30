// TESTS AND DEVELOPMENT ONLY. Named overrides for outcomes the UI must handle.
// In the development server, pick one with ?scenario=<name> on the first page load.
import { http, HttpResponse, delay } from "msw";
import { locationsPath, provisioningRequestsPath, userLookupPath } from "../services/provisioning";

const lookup = `*${userLookupPath}`;
const submit = `*${provisioningRequestsPath}`;
const locations = `*${locationsPath}`;

export const scenarios = {
  success: [],
  lookupForbidden: [http.get(lookup, () => new HttpResponse(null, { status: 403 }))],
  lookupServerError: [http.get(lookup, () => new HttpResponse(null, { status: 500 }))],
  lookupOffline: [http.get(lookup, () => HttpResponse.error())],
  lookupSlow: [
    http.get(lookup, async () => {
      await delay("infinite");
      return new HttpResponse(null, { status: 500 });
    }),
  ],
  locationsServerError: [http.get(locations, () => new HttpResponse(null, { status: 500 }))],
  locationsSlow: [
    http.get(locations, async () => {
      await delay("infinite");
      return new HttpResponse(null, { status: 500 });
    }),
  ],
  submitForbidden: [http.post(submit, () => new HttpResponse(null, { status: 403 }))],
  submitServerError: [http.post(submit, () => new HttpResponse(null, { status: 500 }))],
};

export type ScenarioName = keyof typeof scenarios;
