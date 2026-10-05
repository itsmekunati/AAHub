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
  jiraTicketId: "ITS-12345",
};

function submit(body: Record<string, string>) {
  return fetch("http://localhost/api/provisioning-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

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
