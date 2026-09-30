---
paths:
  - "deploy/**"
  - "Dockerfile"
  - ".github/workflows/**"
---
# CI/CD and deployment

Do not change these files unless the task explicitly asks for it.

- **GitHub Actions**: type check, lint, component tests, verify the generated API types match the committed spec, build, Playwright tests, container image build on pull request; image publish on merge to `main`.
- **Argo CD** deploys from Git using the manifests in `deploy/`. Never make manual `oc`/`kubectl` changes to running environments; change the manifests in Git.
- **ROSA/OpenShift**: the container runs as non-root and works with OpenShift's arbitrary UID assignment; exposes only non-privileged ports (e.g. 8080). How the built app is served (e.g. an unprivileged web server container) is TBC.
- **One build, promoted through every environment (decided).** Environment differences (API base URL, environment name) come from a runtime `config.json` served next to `index.html`, supplied per environment from an OpenShift **ConfigMap** mounted into the web server's document root. Never bake environment-specific values into the build with `VITE_*` variables. The build contains no `config.json`, so a missing ConfigMap makes the app show an error page rather than run with the wrong settings. The file is public: no secrets.
- This UI is built and deployed independently of the backend. Do not assume they are released together.
