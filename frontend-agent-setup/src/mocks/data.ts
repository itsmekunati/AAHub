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
      userNumber: "100001",
      firstName: "Alex",
      lastName: "Example",
      email: "alex.example@example.test",
      jobTitle: "Policy officer",
    },
  },
  {
    userType: "forestry",
    user: {
      userNumber: "200002",
      firstName: "Sam",
      lastName: "Sample",
      email: "sam.sample@example.test",
      jobTitle: "",
    },
  },
  {
    userType: "nature",
    user: {
      userNumber: "300003",
      firstName: "Jo",
      lastName: "Test",
      email: "jo.test@example.test",
      jobTitle: "Ecologist",
    },
  },
];

export const fakeRequestId = "PR-000123";

export const fakeLocations = ["Perth", "SASA", "House", "Inverness"];
