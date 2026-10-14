// TESTS AND DEVELOPMENT ONLY. Obviously fake people and example.test addresses.
import type { DirectoryUser, UserType } from "../services/provisioning";
import type { LdapApplication, RoleUserType } from "../services/roleManagement";

export interface FakeDirectoryEntry {
  userType: UserType;
  user: DirectoryUser;
}

export const fakeDirectory: FakeDirectoryEntry[] = [
  {
    userType: "SG",
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
    userType: "FGS",
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
    userType: "SNH",
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

export interface FakeExistingUser {
  userType: UserType;
  userIdentifier: string;
  email: string;
  userXNumber: string;
}

// A NatureScot user who is already in FutureDatabase, so provisioning them again is refused.
export const fakeExistingUsers: FakeExistingUser[] = [
  { userType: "SNH", userIdentifier: "GAKWO400004", email: "kim.existing@example.test", userXNumber: "x400004" },
];

// The transaction ID is the backend's own reference. It is separate from the JSM/Jira ticket.
export const fakeTransactionId = "TXN-000123";

// The x number the backend gives a newly provisioned user in this environment.
export const fakeProvisionedXNumber = "x500001";

// A role change gets its own transaction ID from the backend, never the ticket.
export const fakeRoleChangeTransactionId = "TXN-000456";

// The locations an operator can choose depend on the user type. Placeholders until the backend supplies them.
export const fakeLocations: Record<UserType, string[]> = {
  SG: ["Perth", "SASA", "House", "Inverness"],
  FGS: ["Silvan House", "Dumfries", "Dingwall"],
  SNH: ["Great Glen House", "Battleby", "Golspie", "Galashiels"],
};

export interface FakeLdapMembership {
  userType: RoleUserType;
  userIdentifier: string;
  groups: string[];
}

export const fakeLdapMemberships: FakeLdapMembership[] = [
  { userType: "SG", userIdentifier: "x123456", groups: ["RPS-RegisteredUser"] },
  { userType: "public", userIdentifier: "jo.bloggs", groups: ["RPS-TransactionalCustomer"] },
];

function exampleApplication(id: string, name: string, groupCount: number): LdapApplication {
  const groups = ["A", "B"].slice(0, groupCount).map((letter) => ({
    id: `${id.toUpperCase()}-Example-${letter}`,
    name: `${name} - Example group ${letter}`,
  }));
  return { id, name, groups };
}

/** RP&S uses its real group names; the other applications have obviously made-up groups. */
export function fakeLdapCatalogue(userType: string | null): LdapApplication[] {
  const rps: LdapApplication = {
    id: "rps",
    name: "RP&S",
    groups: [
      { id: "RPS-RegisteredUser", name: "RPS - RegisteredUser" },
      { id: "RPS-TransactionalCustomer", name: "RPS - TransactionalCustomer" },
    ],
    ...(userType === "public"
      ? {
          minimumGroups: { message: "User type is Public, this user type must belong to one or both of these groups." },
        }
      : {}),
  };
  return [
    rps,
    exampleApplication("lpis", "LPIS", 2),
    exampleApplication("lis", "LIS", 1),
    exampleApplication("agscensus", "AgsCensus", 2),
    exampleApplication("claims", "Claims", 1),
    exampleApplication("srsp", "SRSP", 2),
    exampleApplication("contracts", "Contracts", 1),
    exampleApplication("debts", "Debts", 2),
    exampleApplication("apply", "Apply", 1),
  ];
}
