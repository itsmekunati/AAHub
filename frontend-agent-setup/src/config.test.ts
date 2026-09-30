import { http, HttpResponse } from "msw";
import { getConfig, loadConfig } from "./config";
import { server } from "./mocks/node";

describe("Runtime configuration", () => {
  afterEach(() => {
    // Restore the configuration the test set-up provides for every other test.
    server.use(
      http.get("*/config.json", () => HttpResponse.json({ apiBaseUrl: "/api", environmentName: "Test environment" })),
    );
    return loadConfig();
  });

  it("loads the environment's settings from config.json at start-up", async () => {
    server.use(
      http.get("*/config.json", () =>
        HttpResponse.json({ apiBaseUrl: "https://api.example.test/api", environmentName: "Pre-production" }),
      ),
    );

    const loaded = await loadConfig();

    expect(loaded).toEqual({ apiBaseUrl: "https://api.example.test/api", environmentName: "Pre-production" });
    expect(getConfig()).toEqual(loaded);
  });

  it("refuses a config.json with a missing setting", async () => {
    server.use(http.get("*/config.json", () => HttpResponse.json({ apiBaseUrl: "/api" })));

    await expect(loadConfig()).rejects.toThrow("environmentName");
  });

  it("refuses to start when config.json cannot be loaded", async () => {
    server.use(http.get("*/config.json", () => new HttpResponse(null, { status: 404 })));

    await expect(loadConfig()).rejects.toThrow("config.json");
  });
});
