---
paths:
  - "src/config*.ts"
  - "src/main.tsx"
  - "public/config.json"
  - "vite.config.*"
---
# Runtime configuration

**One build for every environment.** The same build is deployed everywhere; only the configuration differs.

- At start-up the app loads `config.json` from next to `index.html` and refuses to start (showing a plain error page) if it is missing or incomplete.
- The file is public: never put secrets in it.
- Settings (validated in `src/config.ts`):
  - `apiBaseUrl`: base URL of the backend API, e.g. `/api`.
  - `environmentName`: the name of this instance, shown to users; unique for each environment.
  <!-- SETUP: list this application's other settings here. -->
- `public/config.json` holds the local development values and is **removed from production builds**. Each deployed environment supplies its own `config.json` (in OpenShift, from a ConfigMap; see `deploy.md`).
- Do not use `VITE_*` build-time variables for anything that differs between environments.
- Read settings with `getConfig()` from `src/config.ts`.
- When you add a setting: validate it in `loadConfig()`, add it to `public/config.json` and `src/test/testConfig.ts`, and list it here.
