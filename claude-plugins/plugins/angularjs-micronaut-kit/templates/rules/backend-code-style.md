---
paths:
  - "av-service/**/*.java"
  - "av-service/pom.xml"
---
# Java 21 and Micronaut 4 conventions

- Small, focused classes and methods. Meaningful names. No dead code or commented-out code.
- Target **Java 21 (LTS)**. Set the version in one place per tool (`pom.xml`, CI, container base image) and keep them in sync. No preview features.
- Use modern Java where it helps: records for DTOs, `var` for obvious local types, switch expressions, pattern matching.
- This project uses **Micronaut 4.x**. Micronaut does dependency injection, AOP and serialization at **compile time** (annotation processors), so: annotate DTOs with `@Serdeable` (Micronaut Serialization, not Jackson databind reflection), add `@Introspected` where validation or bean introspection needs it, and check the current Micronaut 4 documentation before using an API. Do not copy Spring or Micronaut 3 code without verifying it.
- Let the Micronaut BOM (the parent POM) choose versions of the libraries it manages. Do not pin them manually.
<!-- SETUP: if the team uses Gradle instead of Maven, replace pom.xml and ./mvnw throughout the rules and CLAUDE.md. -->
- Package layout under `av-service/src/main/java/.../`: `api/` (controllers and request/response DTOs), `service/` (business logic and orchestration), `persistence/` (repositories and entities), one gateway package per external system the API calls, `config/` (configuration beans and `@ConfigurationProperties`), `exception/` (error types and exception handlers). Schema migrations live in `av-service/src/main/resources/db/migration/`.
- Constructor injection only (`@Singleton` beans with final fields). No field injection.
- DTOs for API input/output; never expose entities or other persistence objects directly.
- Bean Validation on all request DTOs; `@Validated` on controllers and `@Valid` on request bodies.
- One consistent error response shape for every `4xx` and `5xx`, produced by `ExceptionHandler` beans in `exception/`. No stack traces or internal messages to the client. The frontend maps this shape to its error messages, so a change to it is a change on both sides.
<!-- SETUP: document the error response shape here once decided (e.g. Micronaut's JSON:API-style error or a project-specific record). -->
- Configuration via `application.yml` plus environment variables. No hard-coded hosts or credentials.
- Use SLF4J for logging. Never use `System.out`. Never log passwords, tokens, secrets or unnecessary personal data.
- Use the formatter and Checkstyle configuration committed in this repo; do not introduce a competing style.
