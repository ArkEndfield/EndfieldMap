# Repository Guidelines

## Project Structure & Module Organization

- The main web app lives in `src` (`App.tsx`, `main.tsx`, reusable UI in `src/components`, hooks in `src/hooks`, shared config/constants in `src/const`, and data/services in `src/services`).
- Shared libraries are in `packages/map-core` and `packages/tools`, built with Vite and consumed via workspace dependencies.
- Static assets go in `public`; build output is written to `dist` and should not be edited by hand.

## Build, Test, and Development Commands

- `pnpm dev` – start the Vite dev server for the web app.
- `pnpm build` – build tools, core, and the web app (`packages/*` and `src`).
- `pnpm preview` – serve the production build locally using the latest build.
- `pnpm lint` / `pnpm lint:fix` – run ESLint and Prettier checks or auto-fix issues.
- Package tests (Vitest) run per package, e.g. `cd packages/map-core && pnpm test` or `pnpm --filter "./packages/tools" test`.

## Coding Style & Naming Conventions

- TypeScript + React functional components with hooks-first state management (MobX/Zustand where already in use).
- Formatting is enforced by Prettier (`.prettierrc`): 2-space indent, semicolons, single quotes, and 120-character line width.
- Use `PascalCase` for React components and `camelCase` for variables, functions, and most file names (e.g., `useMapStore.ts`).
- Prefer explicit types over `any`; use named exports when practical.

## Testing Guidelines

- Use Vitest for unit tests in `packages/*`; colocate tests as `*.test.ts` / `*.test.tsx` near the code under test.
- New features and bug fixes should include or update tests covering happy paths and key edge cases.
- Before opening a PR, run relevant package tests and `pnpm lint`.

## Commit & Pull Request Guidelines

- Follow Conventional Commit style as in the history, e.g., `feat: add pole presets`, `fix: handle empty tiles`.
- Keep commits focused and incremental; avoid mixing large refactors with behavioral changes.
- Pull requests should include a concise description, linked issue(s) where relevant, and screenshots/GIFs for any UI-visible changes.

## Agent-Specific Instructions

- Prefer minimal, targeted changes aligned with existing patterns and directory layout.
- Do not introduce new dependencies or tooling without clear justification in the PR description or accompanying notes.

