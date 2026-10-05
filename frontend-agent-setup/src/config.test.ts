import { http, HttpResponse, type JsonBodyType } from "msw";
import { getConfig, loadConfig } from "./config";
import { server } from "./mocks/node";
import { testConfig } from "./test/testConfig";

function serveConfig(body: JsonBodyType) {
  server.use(http.get("*/config.json", () => HttpResponse.json(body)));
}

describe("Runtime configuration", () => {
  afterEach(() => {
    // Restore the configuration the test set-up provides for every other test.
    serveConfig(testConfig);
    return loadConfig();
  });

  it("loads the environment's settings from config.json at start-up", async () => {
    const preProduction = {
      apiBaseUrl: "https://api.example.test/api",
      environmentName: "Pre-production",
      managedEnvironments: ["UAT", "OAT", "Pre-Production"],
      otherInstance: { label: "Go to the Production instance", url: "https://prod.example.test/" },
    };
    serveConfig(preProduction);

    const loaded = await loadConfig();

    expect(loaded).toEqual(preProduction);
    expect(getConfig()).toEqual(loaded);
  });

  it("treats the link to another instance as optional", async () => {
    serveConfig({ apiBaseUrl: "/api", environmentName: "Production", managedEnvironments: ["Production"] });

    expect((await loadConfig()).otherInstance).toBeUndefined();
  });

  it("refuses a config.json with a missing setting", async () => {
    serveConfig({ apiBaseUrl: "/api", managedEnvironments: ["UAT"] });

    await expect(loadConfig()).rejects.toThrow("environmentName");
  });

  it("refuses a config.json without the environments it manages", async () => {
    serveConfig({ apiBaseUrl: "/api", environmentName: "Test", managedEnvironments: [] });

    await expect(loadConfig()).rejects.toThrow("managedEnvironments");
  });

  it("refuses a link to another instance that is not an http(s) address", async () => {
    serveConfig({
      apiBaseUrl: "/api",
      environmentName: "Test",
      managedEnvironments: ["UAT"],
      otherInstance: { label: "Go elsewhere", url: "javascript:alert(1)" },
    });

    await expect(loadConfig()).rejects.toThrow("otherInstance");
  });

  it("refuses to start when config.json cannot be loaded", async () => {
    server.use(http.get("*/config.json", () => new HttpResponse(null, { status: 404 })));

    await expect(loadConfig()).rejects.toThrow("config.json");
  });
});
