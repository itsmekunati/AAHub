---
paths:
  - "deploy/**"
  - "**/Dockerfile"
  - ".github/workflows/**"
---
# CI/CD and deployment

Do not change these files unless the task explicitly asks for it.

<!-- SETUP: describe the delivery pipeline and platform. The defaults below assume GitHub Actions, OpenShift and Argo CD. -->
- **GitHub Actions**: on pull request, backend build with unit and integration tests, frontend lint, unit tests and build, Playwright tests, and container image builds; on merge to `main`, image publish.
- **Argo CD** deploys from Git using the manifests in `deploy/`. Never make manual `oc`/`kubectl` changes to running environments; change the manifests in Git.
- **OpenShift**: containers run as non-root and work with an arbitrary UID; expose only non-privileged ports (e.g. 8080); the API provides health endpoints (Micronaut Management: `/health`, with liveness and readiness).
- **Configuration differs per environment** through ConfigMaps and Secrets, never through code changes. The frontend uses one build for every environment, configured at run time (see `runtime-config.md`).
- The API and the UI live in one repository but are separate images. Whether they are always released together is an open question: see `docs/open-questions.md`.
