---
paths:
  - "src/main/java/**/service/**"
  - "src/main/java/**/api/**"
  - "src/test/java/**/service/**"
---
# User type and internal/external classification

Two different things. Do not confuse them.

## 1. User type (User Provisioning)

**User Provisioning applies to internal users only.** The operator chooses the user's **user type** in the UI (radio buttons), and the request carries it as `userType`:

| `userType` | Label in the UI |
|---|---|
| `government` | Government |
| `forestry` | Forestry |
| `nature` | Nature |

- `userType` is **required** on provisioning requests and user look-ups. Accept only these three values; anything else (missing, empty, different case, unknown value) is a `400` validation error. Never default it.
- Model it as an enum (e.g. `UserType`), not with ad-hoc string checks.
- The user type does **not** decide internal or external. All provisioned users are internal. **External user flows live in User Role Management only.**
- The other mandatory fields of a provisioning request are listed in `.claude/rules/transactions.md`.
- Record the chosen `userType` in the audit log for every provisioning action.

## 2. Internal/external classification (User Role Management only)

Internal and external users only matter in **User Role Management** (not built yet). There, internal and external users are different kinds of user with different attributes and LDAP locations. Model this explicitly (e.g. a `UserClassification` enum: `INTERNAL`, `EXTERNAL`).

**The classification is decided by the user's email domain.** Email addresses on the **gov.uk**, **Forestry** and **Nature** domains are **internal**; every other address is **external**.

- Classification happens **server-side only**, in one dedicated service/class. Never accept a classification sent by the client.
- The list of internal email domains lives in **configuration**, not in code (the exact domain values are still open: see `docs/open-questions.md`).
- Normalise before comparing: trim whitespace and lowercase the address. Extract the domain as everything after the last `@`.
- Match the domain **exactly** against the configured list, or as a subdomain only where the configuration explicitly says subdomains count (e.g. `*.gov.uk`). Do not use a plain `endsWith` on the address or domain: if `gov.uk` is internal, `someone@notgov.uk` must not pass.
- Anything that does not match an internal domain is **external**. Invalid or missing email addresses are rejected with a validation error, not defaulted to a classification.
- The email domain is self-declared and is not proof of identity. It is treated as sufficient on its own to decide internal vs external; no separate approval or verification step is required.
- Record the email and the resulting classification in the audit log for every User Role Management action.
