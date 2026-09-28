---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "e2e/**/*.ts"
  - "package.json"
  - "eslint.config.*"
  - "tsconfig*.json"
---
# TypeScript and React conventions

- Small, focused components and functions. Meaningful names. No dead code or commented-out code.
- **TypeScript in strict mode.** No `any` (use `unknown` and narrow it), no `@ts-ignore` or `@ts-expect-error` without a comment explaining why, and no type assertions (`as`) to force API data into a shape. Use the generated API types.
- Use the ESLint (with typescript-eslint) and formatter configuration committed in this repo; follow the Design System project's conventions where they apply. Do not introduce a competing style.
- Functional components and hooks only.
- One component per file, named to match the file.
- Keep API calls in `src/services/`, not inside components.
- Handle loading, empty and error states for every data-driven screen.
- Do not add dependencies without a clear reason; ask first for major ones.
