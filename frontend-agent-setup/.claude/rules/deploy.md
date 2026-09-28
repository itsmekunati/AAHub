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
- Environment differences (such as the API base URL) come from configuration at deploy time, not code changes. Build-time variables end up in the public bundle.
- This UI is built and deployed independently of the backend. Do not assume they are released together.
