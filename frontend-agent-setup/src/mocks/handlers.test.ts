import { fakeTransactionId } from "./data";

const validRequest = {
  userType: "government",
  userIdentifier: "U100001",
  firstName: "Alex",
  surname: "Example",
  email: "alex.example@example.test",
  managerXNumber: "X000001",
  jobTitle: "Policy officer",
  location: "Perth",
  jiraTicketId: "ITS-123456",
};

function submit(body: Record<string, string>) {
  return fetch("http://localhost/api/provisioning-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Mock API: LDAP group memberships", () => {
  function getGroups(userIdentifier: string, userType: string) {
    return fetch(`http://localhost/api/users/${userIdentifier}/ldap-groups?userType=${userType}`);
  }

  it("returns the groups of a known user", async () => {
    const response = await getGroups("x123456", "scottish-government");

    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({ groups: expect.arrayContaining([expect.any(String)]) as unknown });
  });

  it("returns 404 for an unknown user, or a known user under another user type", async () => {
    expect((await getGroups("x999999", "scottish-government")).status).toBe(404);
    expect((await getGroups("x123456", "public")).status).toBe(404);
  });
});

describe("Mock API: LDAP group catalogue", () => {
  async function getCatalogue(userType: string) {
    const response = await fetch(`http://localhost/api/ldap-group-catalogue?userType=${userType}`);
    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    const applications: unknown = typeof body === "object" && body !== null ? Reflect.get(body, "applications") : [];
    return Array.isArray(applications)
      ? applications.map((application: unknown) => ({
          id: typeof application === "object" && application !== null ? Reflect.get(application, "id") : undefined,
          minimumGroups:
            typeof application === "object" && application !== null ? Reflect.get(application, "minimumGroups") : undefined,
        }))
      : [];
  }

  it("lists the nine applications in tab order", async () => {
    const applications = await getCatalogue("scottish-government");

    expect(applications.map((application) => application.id)).toEqual([
      "rps",
      "lpis",
      "lis",
      "agscensus",
      "claims",
      "srsp",
      "contracts",
      "debts",
      "apply",
    ]);
  });

  it("sets the RP&S minimum-groups rule for Public users only", async () => {
    expect((await getCatalogue("public")).find((application) => application.id === "rps")?.minimumGroups).toBeDefined();
    expect(
      (await getCatalogue("scottish-government")).find((application) => application.id === "rps")?.minimumGroups,
    ).toBeUndefined();
  });

  it("knows x123456 is in RPS - RegisteredUser", async () => {
    const response = await fetch("http://localhost/api/users/x123456/ldap-groups?userType=scottish-government");

    expect(await response.json()).toEqual({ groups: ["RPS-RegisteredUser"] });
  });
});

describe("Mock API: role change requests", () => {
  const validChange = {
    userType: "scottish-government",
    userIdentifier: "x123456",
    groupsToAdd: ["RPS-TransactionalCustomer"],
    groupsToRemove: [],
    jiraTicketId: "ITS-123456",
  };

  function submitChange(body: Record<string, unknown>) {
    return fetch("http://localhost/api/role-change-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("accepts a change with a valid ticket and returns a transaction ID that is not the ticket", async () => {
    const response = await submitChange(validChange);

    expect(response.status).toBe(201);
    const body: unknown = await response.json();
    expect(body).toEqual({ transactionId: "TXN-000456" });
  });

  it.each([
    { jiraTicketId: "" },
    { jiraTicketId: "ITS-12345" },
    { jiraTicketId: "123456" },
    { userIdentifier: "" },
    { groupsToAdd: [], groupsToRemove: [] },
  ])("rejects %j", async (change) => {
    expect((await submitChange({ ...validChange, ...change })).status).toBe(400);
  });
});

describe("Mock API: provisioning requests", () => {
  it("accepts a complete request and returns a transaction ID that is not the ticket", async () => {
    const response = await submit(validRequest);

    expect(response.status).toBe(201);
    const body: unknown = await response.json();
    expect(body).toEqual({ transactionId: fakeTransactionId });
    expect(fakeTransactionId).not.toBe(validRequest.jiraTicketId);
  });

  it.each(Object.keys(validRequest))("rejects a request with no %s", async (field) => {
    const response = await submit({ ...validRequest, [field]: " " });

    expect(response.status).toBe(400);
  });
});
