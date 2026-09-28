---
paths:
  - "src/main/java/**/service/**"
  - "src/main/java/**/api/**"
  - "src/test/java/**/service/**"
---
# Email-domain user classification

Internal and external users are different user types with different attributes and LDAP locations. Model this explicitly (e.g. a `UserType` enum), not with ad-hoc string checks.

**User type is decided by the email domain (suffix) submitted in the UI.**

- Classification happens **server-side only**, in one dedicated service/class. Never accept a user type sent by the client.
- The list of internal email domains lives in **configuration**, not in code.
- Normalise before comparing: trim whitespace and lowercase the address. Extract the domain as everything after the last `@`.
- Match the domain **exactly** against the configured list. Do not use a plain `endsWith` on the address or domain: if `corp.example` is internal, `someone@notcorp.example` would wrongly pass. Whether subdomains count as internal must be an explicit configured decision.
- Anything that does not match an internal domain is **external**. Invalid or missing email addresses are rejected with a validation error, not defaulted to a type.
- The email domain is self-declared and is not proof of identity. It is treated as sufficient on its own to decide internal vs external; no separate approval or verification step is required.
- Record the email and the resulting classification in the audit log for every provisioning action.

Which domains are internal, and whether subdomains count, is still open: see `docs/open-questions.md`.
