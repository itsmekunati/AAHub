// TESTS AND DEVELOPMENT ONLY. Named overrides for outcomes the UI must handle.
// In the development server, pick one with ?scenario=<name> on the first page load.
import { http, HttpResponse, delay } from "msw";
import { auditEventsPath } from "../services/auditEvents";
import { locationsPath, provisioningRequestsPath, userLookupPath } from "../services/provisioning";
import { ldapGroupCataloguePath, ldapGroupsPath, roleChangeRequestsPath } from "../services/roleManagement";

const roleChange = `*${roleChangeRequestsPath}`;
const lookup = `*${userLookupPath}`;
const submit = `*${provisioningRequestsPath}`;
const locations = `*${locationsPath}`;
const ldapGroups = `*${ldapGroupsPath}`;
const catalogue = `*${ldapGroupCataloguePath}`;

export const scenarios = {
  success: [],
  auditUnavailable: [http.post(`*${auditEventsPath}`, () => new HttpResponse(null, { status: 500 }))],
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
  roleChangeForbidden: [http.post(roleChange, () => new HttpResponse(null, { status: 403 }))],
  roleChangeServerError: [http.post(roleChange, () => new HttpResponse(null, { status: 500 }))],
  ldapGroupsForbidden:[http.get(ldapGroups, () => new HttpResponse(null, { status: 403 }))],
  ldapGroupsServerError: [http.get(ldapGroups, () => new HttpResponse(null, { status: 500 }))],
  ldapGroupsOffline: [http.get(ldapGroups, () => HttpResponse.error())],
  catalogueServerError: [http.get(catalogue, () => new HttpResponse(null, { status: 500 }))],
  ldapGroupsSlow: [
    http.get(ldapGroups, async () => {
      await delay("infinite");
      return new HttpResponse(null, { status: 500 });
    }),
  ],
};

export type ScenarioName = keyof typeof scenarios;
