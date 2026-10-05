// TESTS AND DEVELOPMENT ONLY. Obviously fake people and example.test addresses.
import type { DirectoryUser, UserType } from "../services/provisioning";

export interface FakeDirectoryEntry {
  userType: UserType;
  user: DirectoryUser;
}

export const fakeDirectory: FakeDirectoryEntry[] = [
  {
    userType: "government",
    user: {
      userIdentifier: "U100001",
      firstName: "Alex",
      surname: "Example",
      email: "alex.example@example.test",
      managerXNumber: "X000001",
      jobTitle: "Policy officer",
    },
  },
  {
    userType: "forestry",
    user: {
      userIdentifier: "Z200002",
      firstName: "Sam",
      surname: "Sample",
      email: "sam.sample@example.test",
      managerXNumber: "X000002",
      jobTitle: "",
    },
  },
  {
    userType: "nature",
    user: {
      userIdentifier: "GAKWO300003",
      firstName: "Jo",
      surname: "Test",
      email: "jo.test@example.test",
      managerXNumber: "X000003",
      jobTitle: "Ecologist",
    },
  },
];

// The transaction ID is the backend's own reference. It is separate from the JSM/Jira ticket.
export const fakeTransactionId = "TXN-000123";

export const fakeLocations = ["Perth", "SASA", "House", "Inverness"];
