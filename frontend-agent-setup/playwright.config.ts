import { defineConfig, devices } from "@playwright/test";

// Set E2E_BASE_URL to run against a deployed TEST environment (never production).
// Without it, the suite starts the local mock-mode dev server (MSW supplies the API).
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // one local retry absorbs the intermittent Windows worker crash
  // Several parallel Chromium instances crash on some Windows machines ("Target crashed").
  workers: process.env.CI ? 2 : 1,
  // The HTML report (playwright-report/index.html) is written on every run; view it with `npm run e2e:report`.
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --port 5173 --strictPort",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
