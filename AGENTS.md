# Repository Guidelines

## Project Structure & Module Organization

- The main web app lives in `apps/web` (source under `apps/web/src/`); native app in `apps/native`.
- Shared libraries are in `packages/` (map-core, tools, map-adapters, map-hooks, map-service, web-components, etc.), built with Vite and consumed via workspace dependencies.
- Static assets go in `public` (per app); build output is written to `dist` and should not be edited by hand.

## Build, Test, and Development Commands

- `pnpm dev:web`, `pnpm dev:native`, `pnpm dev:components` – start dev for web app, native app, or Storybook.
- `pnpm build` – build all. `pnpm build:web`, `pnpm build:packages`, `pnpm build:adapter:ol`, `pnpm build:adapter:maplibre`, `pnpm build:components` / `pnpm build:components:docs` for targeted builds.
- `pnpm preview:web` – serve the production web build locally.
- `pnpm lint` / `pnpm lint:fix` – run ESLint and Prettier checks or auto-fix issues.
- `pnpm clean` – remove `dist`, `.turbo`, and `*.tsbuildinfo` (cross-platform).
- Package tests (Vitest): `pnpm test` for all, or e.g. `cd packages/map-core && pnpm test`, `pnpm --filter "./packages/tools" test`.
- Library packages use `tsconfig.build.json` for build; apps (e.g. `apps/web`, `packages/web-components`) may use `tsconfig.app.json`.

## Coding Style & Naming Conventions

- TypeScript + React functional components with hooks-first state management (MobX where already in use).
- Formatting is enforced by Prettier (`.prettierrc`): 2-space indent, semicolons, single quotes, and 120-character line width.
- Use `PascalCase` for React components and `camelCase` for variables, functions, and most file names (e.g., `useMapStore.ts`).
- Prefer explicit types over `any`; use named exports when practical.
- DO NOT use `any` type.

## Testing Guidelines

- New features and bug fixes should include or update tests covering happy paths and key edge cases.
- Before opening a PR, run relevant package tests and `pnpm lint`.

## Commit & Pull Request Guidelines

- Follow Conventional Commit style as in the history, e.g., `feat: add pole presets`, `fix: handle empty tiles`.
- Keep commits focused and incremental; avoid mixing large refactors with behavioral changes.
- Pull requests should include a concise description, linked issue(s) where relevant, and screenshots/GIFs for any UI-visible changes.

## Agent-Specific Instructions

- Prefer minimal, targeted changes aligned with existing patterns and directory layout.
- Do not introduce new dependencies or tooling without clear justification in the PR description or accompanying notes.

## Entity Level Filtering Rules

- Any future filtering or toggling behavior based on `level_entities_categorized_with_region.json` or its `levels` / `map_level_id` data must be implemented as derived UI/render state only.
- Do not filter, crop, or skip `levels`, `categories`, or entity `instances` while loading `level_entities_categorized_with_region.json`. The full dataset must remain in memory.
- Level-based filtering may only affect map rendering by updating each render feature's `visible` state and left-side entity panel statistics through `EntityMapDataManager.currentStats` or equivalent derived stats.
- Level-based filtering must not affect `getInstanceById`, player mark import/export/write flows, or entity group visibility persistence.
- Do not route level filters through `entityVisibilityService`, group visibility storage, player mark storage, import/export data formats, or any database-backed user preference unless explicitly requested as a separate non-destructive UI preference.
- Hidden levels must remain reversible: re-enabling a level should immediately restore its instances in rendering/statistics without requiring data reload and without losing marked, selected, active, or visibility state.
