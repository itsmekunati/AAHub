---
name: port-from-jsf
description: Migrate the legacy JSF / PrimeFaces application in av-ui-jsf/ to the AngularJS UI in av-ui/ and the Micronaut API in av-service/ - inventory every page, bean, action, validator and navigation rule, agree one migration plan, then port page by page test-first (backend endpoint first, then the AngularJS screen), committing each page and tracking progress in migration/ so a long run can stop and resume. Use this when the user asks to migrate, port or convert the JSF application, all of it or one page.
argument-hint: "[all | resume | <path to .xhtml page>]"
disable-model-invocation: true
---

# Port the JSF application to AngularJS + Micronaut

Relevant rules: `.claude/rules/tdd.md` and every rule for the areas you touch (`backend-code-style.md`, `persistence.md`, `frontend-code-style.md`, `forms-accessibility.md`, and `design-system.md` if the project has it). Each page is built through the normal skills: `angularjs-micronaut-kit:add-endpoint`, `angularjs-micronaut-kit:persistence`, `angularjs-micronaut-kit:form-with-server-errors`, `angularjs-micronaut-kit:data-page`, all following `angularjs-micronaut-kit:tdd-cycle`.

**Run `angularjs-micronaut-kit:modernise-service` first** if `av-service/` has existing code without tests, so the port builds on tested, standard code.

**`av-ui-jsf/` is read-only.** It is the reference for behaviour, never a place to edit. The protect-files hook refuses edits there. Nothing is deleted from it; retiring it is the team's decision once the new app is live.

**What this does not port:** sign-in, roles, `<security>` constraints, `rendered="#{request.isUserInRole(...)}"` and similar. This kit has no authentication. List each one in the inventory as `out of scope: auth` and report them; never drop a page silently because it was role-protected.

Arguments:
- `all`: inventory the whole application, agree the plan once, then port every page in order.
- `resume`: continue from `migration/progress.md`.
- `<path to .xhtml>`: inventory and port that one page (and the backend it needs).

## 1. Inventory (read-only)

Read `av-ui-jsf/` and write `migration/jsf-inventory.json`. Search, do not guess:

- **Pages:** every `*.xhtml` that is a view (not a `ui:composition` template or `ui:include` fragment), its URL, the template it uses, and the `f:viewParam` / `f:metadata` parameters.
- **Templates and fragments:** the `ui:composition` / `ui:insert` layout (header, menu, footer) and shared includes. These become the AngularJS app shell and shared components.
- **Beans:** for each page, the backing beans it uses (`#{...}` expressions), their scope (`@RequestScoped`, `@ViewScoped`, `@SessionScoped`, `@ApplicationScoped`, `@ManagedBean`), the fields bound to inputs, and the action / actionListener / `p:ajax listener` methods.
- **Business logic and data:** the services, EJBs, DAOs, JPA entities and SQL the beans call, and the tables they read and write.
- **Validation:** `required`, `f:validate*`, custom `@FacesValidator`s, Bean Validation annotations, `@FacesConverter`s, and the message each produces (including `messages*.properties` keys).
- **Navigation:** `faces-config.xml` navigation rules, action outcome strings, `?faces-redirect=true`, and `h:link`/`p:menuitem` targets.
- **PrimeFaces components** used on each page (see the mapping in step 2).
- **Session state:** anything kept in `@SessionScoped` beans or the HTTP session across pages (wizards, carts, "current record"). Each needs an explicit decision.
- **What `av-service/` already has:** it already contains code. List its existing controllers, endpoints, services, entities, repositories and migrations, and for each JSF action or data load note whether `av-service/` already covers it (`reuse`), covers it partly (`extend`) or not at all (`new`). Note its framework and build set-up: if it is not yet a Micronaut 4 / Java 21 / Maven project, that is the first question in the plan, and nothing is ported until it is answered.

Each page entry: `{ id, xhtml, url, template, beans, actions, fields, validations, navigation, primefaces, tables, sessionState, avService (reuse / extend / new per action), outOfScope, dependsOn, status: "pending" }`.

## 2. The migration map

Map each page with these rules. Anything that does not fit is a **question for the user**, not a guess.

| JSF / PrimeFaces | New app |
|---|---|
| `ui:composition` template, menu, header, footer | App shell component and route layout in `av-ui/src/app/` |
| A view (`.xhtml`) | One AngularJS route and page component |
| `h:inputText`, `p:inputText`, `p:inputTextarea`, `p:password` | Design System text input / textarea with label, hint and error |
| `h:selectOneMenu`, `p:selectOneMenu` | Design System select |
| `p:selectOneRadio`, `p:selectManyCheckbox`, `p:selectBooleanCheckbox` | Design System radios / checkboxes |
| `p:calendar`, `p:datePicker` | Design System date input (day, month, year fields) |
| `p:dataTable` (and `lazy="true"`, paginator, sort, filter) | Design System table and pagination; lazy paging, sort and filter become query parameters on a backend endpoint, never client-side over all rows |
| `p:dialog`, `p:confirmDialog` | A separate page or a confirmation page (modal dialogs are hard to make accessible); ask if the user wants otherwise |
| `p:messages`, `h:messages`, `p:growl`, `FacesMessage` | Error summary + inline errors for validation; notification banner for success and other errors |
| `p:tabView`, `p:accordionPanel` | Design System tabs / accordion |
| `p:wizard`, multi-step `@SessionScoped` flows | A multi-page journey; state either sent to the API at each step or held in an AngularJS service for the journey only, decided per flow |
| `p:commandButton` / `h:commandButton` with `action` | A form submit that calls a service method, which calls a REST endpoint |
| `p:ajax` / `update=` partial refresh | Component state updated from a service call; no full-page reload |
| `p:autoComplete`, `p:poll`, `p:fileUpload`, `p:chart`, `p:schedule` | **Ask**: no direct Design System equivalent; propose the nearest pattern |
| Action method business logic | Micronaut `service/` method behind a controller endpoint |
| JSF validators, converters, `required` | Bean Validation on the request DTO (authoritative, `400` with field errors) plus convenience checks in the UI |
| Navigation outcomes | AngularJS routes; redirects after a successful submit go to the next route |
| `messages*.properties` text | Plain-English text in templates, reviewed with `angularjs-micronaut-kit:content-review` |
| JPA entities / DAOs | Micronaut Data entities and repositories; the existing schema becomes the first Flyway migration (`persistence` skill) |

## 3. Plan and confirm (once)

Write `migration/progress.md`:
- **Order:** Sprint 0 test infrastructure if `av-service/src/test/.../support/` or `av-ui/test/helpers/` is missing (the `api-test-infrastructure` and `ui-test-infrastructure` skills); then the database schema and entities; then the app shell from the main template; then pages in dependency order (pages others navigate to or share beans with come first).
- **Per page:** endpoints to add, the AngularJS route and components, PrimeFaces mappings, out-of-scope items.
- **Questions:** every unmapped component, session-state decision, auth item and unclear behaviour, numbered.

Show the plan and the questions. **Stop and wait for the user's answers and OK.** Record the answers in `migration/progress.md`; anything that is really a project decision also goes to `docs/open-questions.md` through `angularjs-micronaut-kit:record-decision`.

With `all`, this is the only confirmation: after it, work through every page without asking again, unless a page hits a new question.

## 4. Port each page (repeat)

For the next `pending` page in `migration/progress.md`:
1. Mark it `in-progress`. Re-read its JSF files (do not rely on memory of earlier pages).
2. **Backend first**, test-first with `add-endpoint` (and `persistence` if it needs tables): one endpoint per action or data load. **Reuse what `av-service/` already has:** call an existing service or endpoint where the inventory says `reuse`, extend it (with tests for the new behaviour, and existing tests still passing) where it says `extend`, and only write new code where it says `new`. Never duplicate an existing service, entity or table. Reproduce the JSF behaviour, including its validation rules and messages. Business logic that lives only in the bean moves into a `service/` class; copy the logic, not the JSF or CDI plumbing.
3. **Then the AngularJS page**, test-first with `form-with-server-errors` or `data-page`: route, component, service and mock scenarios; every state; axe.
4. **Run the checks:** `./mvnw test` in `av-service/`; `npm run lint && npm test` in `av-ui/`.
5. **Commit** with the `angularjs-micronaut-kit:commit` skill: `test(port): <page> failing tests` before `feat(port): <page> - port from JSF`.
6. Mark the page `done` in `migration/progress.md` with the commit hashes, and list any **behaviour differences** from the JSF page (intended or not).
7. If the page hits a question you cannot answer from the code, mark it `needs-decision` with the question, and move on to the next page that does not depend on it.

Keep going until every page is `done`, `needs-decision` or `out of scope`. If the session is interrupted, `/angularjs-micronaut-kit:port-from-jsf resume` continues from the file.

## 5. Finish

- Run `./mvnw clean verify` in `av-service/` and `npm run build` in `av-ui/`.
- Offer `angularjs-micronaut-kit:review-code` on the whole branch and `angularjs-micronaut-kit:a11y-audit` on the ported screens.
- Report: pages done, pages waiting on a decision (with the questions), out-of-scope items (auth), behaviour differences, and endpoints added.

## Hard lines
- Never edit, move or delete anything in `av-ui-jsf/`.
- Never copy JSF, CDI, PrimeFaces or servlet APIs into `av-service/` or `av-ui/`.
- Never port a page without its tests, and never skip a failing test to keep the run going: mark the page `needs-decision` and report.
- Never connect to the JSF application's real database or environment; the schema comes from entities and migration scripts, data from fakes.
