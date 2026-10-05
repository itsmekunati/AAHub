---
paths:
  - "src/pages/**"
  - "src/services/**"
  - "src/mocks/**"
---
# Transactions: JSM/Jira ticket, transaction ID and mandatory fields

A **transaction** is anything the operator submits that creates, changes or removes something: provisioning a user, and adding, editing or removing roles.

- **A JSM/Jira ticket is mandatory on every transaction.** Every journey that submits a transaction asks for the ticket and will not submit without it. Send it with the request. The backend is the authority on whether it is valid.
- **The transaction ID is separate from the ticket.** The backend generates a unique `transactionId` for each transaction and returns it. Show it to the operator as its own item, next to the ticket. Never show the ticket as the reference, and never make up or change a transaction ID in the UI.
- **Mandatory User Provisioning fields:** first name, surname, email address, user identifier (a U, Z or GAKWO identifier), manager X number, job title and location. A request is never submitted with any of them missing.
- **External user flows live in User Role Management only.** The User Provisioning journey is for internal users and never offers an external user.
- **The mock API follows the same rules:** `src/mocks/handlers.ts` rejects a transaction with a missing ticket or mandatory field (`400`) and returns a transaction ID that is not the ticket. Keep it that way when adding a new transaction.
- Still open (see `docs/open-questions.md`): the formats of the ticket and of the U, Z, GAKWO and X identifiers, and whether the manager X number is retrieved or typed in. Do not invent stricter checks.
