---
paths:
  - "av-ui/src/app/config*.js"
  - "av-ui/src/app/app.module.js"
  - "av-ui/src/config.json"
  - "av-ui/src/index.html"
---
# Frontend runtime configuration

**One build for every environment.** The same build is deployed everywhere; only the configuration differs.

- Before bootstrapping AngularJS, the app loads `config.json` from next to `index.html`, then registers it as a constant (e.g. `appConfig`) and calls `angular.bootstrap` manually. If the file is missing or incomplete, it shows a plain error page instead of starting.
- The file is public: never put secrets in it.
- Settings (validated before bootstrap):
  - `apiBaseUrl`: base URL of the backend API, e.g. `/api`.
  - `environmentName`: the name of this instance, shown to users; unique for each environment.
  <!-- SETUP: list this application's other settings here, and the path of the committed development config.json. -->
- The committed `config.json` holds the local development values and is **removed from production builds**. Each deployed environment supplies its own (in OpenShift, from a ConfigMap; see `deploy.md`).
- Do not bake anything that differs between environments into the build.
- Inject `appConfig` wherever a setting is needed; never read `window` globals.
- When you add a setting: validate it before bootstrap, add it to the development `config.json` and the test configuration, and list it here.
