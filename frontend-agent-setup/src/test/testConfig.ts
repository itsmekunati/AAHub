// The config.json every test runs with (see setup.ts). Fake values only.
export const testConfig = {
  apiBaseUrl: "/api",
  environmentName: "Test environment",
  managedEnvironments: ["UAT", "OAT"],
  otherInstance: { label: "Go to the Production instance", url: "https://prod.example.test/" },
};
