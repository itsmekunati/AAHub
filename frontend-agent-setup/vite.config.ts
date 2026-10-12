import { rmSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig, type Plugin } from "vitest/config";
import { uiAuditLogPlugin } from "./dev/uiAuditLog";

// public/ holds files the development server needs but a production build must not ship:
// the MSW worker (mock code) and the local config.json (each environment supplies its own).
const developmentOnlyFiles = ["mockServiceWorker.js", "config.json"];

function removeDevelopmentOnlyFilesFromBuild(): Plugin {
  let outDir = "dist";
  return {
    name: "remove-development-only-files-from-build",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      for (const file of developmentOnlyFiles) {
        rmSync(resolve(outDir, file), { force: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), removeDevelopmentOnlyFilesFromBuild(), uiAuditLogPlugin()],
  // The Design System's own Sass raises deprecation warnings we cannot fix here.
  css: { preprocessorOptions: { scss: { quietDeps: true } } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // Playwright specs in e2e/ run with `npm run e2e`, not Vitest.
    exclude: [...configDefaults.exclude, "e2e/**"],
    // Many parallel jsdom forks crash with 0xC0000409 on Windows; two workers is stable.
    maxWorkers: 2,
  },
});
