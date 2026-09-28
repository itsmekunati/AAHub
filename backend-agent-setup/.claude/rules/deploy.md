---
paths:
  - "deploy/**"
  - "Dockerfile"
  - ".github/workflows/**"
---
# CI/CD and deployment

Do not change these files unless the task explicitly asks for it.

- **GitHub Actions**: build, unit and integration tests, generate `openapi.json`, container image build on pull request; on merge to `main`, image publish plus the spec-sync workflow that opens a PR in the frontend repo.
- **Argo CD** deploys from Git using the manifests in `deploy/`. Never make manual `oc`/`kubectl` changes to running environments; change the manifests in Git.
- **ROSA/OpenShift**: the container runs as non-root and works with OpenShift's arbitrary UID assignment; exposes only non-privileged ports (e.g. 8080); provides liveness/readiness endpoints (Spring Boot Actuator).
- Configuration differs per environment through config/Secrets, never through code changes.
- This service is built and deployed independently of the frontend. Do not assume they are released together.
- The spec-sync workflow should use a GitHub App installation scoped to the frontend repo in preference to a personal access token (still open: see `docs/open-questions.md`).
