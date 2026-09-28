---
paths:
  - "**/*.java"
  - "pom.xml"
---
# Java and Spring Boot 4 conventions

- Small, focused classes and methods. Meaningful names. No dead code or commented-out code.
- Target **Java 25 (LTS)**. Set the version in one place per tool (build file, CI, container base image) and keep them in sync. No preview features, and no move to a non-LTS release without asking.
- Use modern Java where it helps: records for DTOs, `var` for obvious local types, switch expressions, pattern matching.
- This project uses **Spring Boot 4.x** (Spring Framework 7, Jakarta EE 11, Jackson 3). Much online material targets Spring Boot 3 and Jackson 2, so check the current Spring Boot 4 documentation before using an API, and do not copy Boot 3-era code without verifying it. Jackson 3 package names differ from Jackson 2.
- Let Spring Boot's dependency management choose versions of the libraries it manages (Spring LDAP, Spring Data, Hibernate, Jackson, etc.). Do not pin them manually. springdoc-openapi is **not** managed by Spring Boot, so pin it explicitly to the 3.x line.
- Constructor injection only. No field injection.
- DTOs for API input/output; never expose entities or LDAP objects directly.
- Bean Validation on all request DTOs.
- One global exception handler returning a consistent error shape. No stack traces to the client.
- Configuration via `application.yml` plus environment variables. No hard-coded hosts, credentials or DNs.
- Use SLF4J for logging. Never use `System.out`.
- Use the formatter/linter configuration committed in this repo; do not introduce a competing style.
