---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "e2e/**/*.ts"
  - "package.json"
  - "eslint.config.*"
  - ".prettierrc*"
  - ".prettierignore"
  - "tsconfig*.json"
---
# TypeScript and React conventions

- Small, focused components and functions. Meaningful names. No dead code or commented-out code.
- **TypeScript in strict mode.** No `any` (use `unknown` and narrow it), no `@ts-ignore` or `@ts-expect-error` without a comment explaining why, and no type assertions (`as`) to force API data into a shape. Use the generated API types.
- Use the ESLint (with typescript-eslint) and Prettier configuration committed in this repo; follow the Design System project's conventions where they apply. Do not introduce a competing style.
- Tooling (decided): Vite for the dev server and build, Vitest for component tests, ESLint 9 with typescript-eslint, react-hooks and jsx-a11y (`eslint.config.js`), and Prettier for formatting (`.prettierrc.json`: 120 characters, otherwise Prettier's defaults; `.prettierignore` leaves out generated files, Markdown and YAML). Scripts are listed in `CLAUDE.md` "Commands".
- **Formatting (decided): Prettier decides layout, not ESLint and not by hand.** Run `npm run format` after editing; `npm run lint` fails on any file Prettier would change. Do not add ESLint style rules that fight Prettier, and do not reformat generated code.
- Functional components and hooks only.
- One component per file, named to match the file.
- Keep API calls in `src/services/`, not inside components.
- Handle loading, empty and error states for every data-driven screen.
- Do not add dependencies without a clear reason; ask first for major ones.
