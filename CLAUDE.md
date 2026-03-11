# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Development**: `pnpm dev:web`, `pnpm dev:native`, `pnpm dev:components` (Storybook).
- **Build**: `pnpm build` (build all); `pnpm build:web`, `pnpm build:packages`, `pnpm build:adapter:ol`, `pnpm build:adapter:maplibre`, `pnpm build:components` / `pnpm build:components:docs`.
- **Linting**: `pnpm lint` (runs ESLint); `pnpm lint:fix` (Prettier + ESLint fix).
- **Testing**: `pnpm test` (all packages); or per package, e.g. `cd packages/map-core && pnpm test`, `pnpm --filter "./packages/tools" test`.
- **Preview**: `pnpm preview:web` (serve production web build locally).
- **i18n**: `pnpm lng:type` (generate i18next types).
- **Clean**: `pnpm clean` (remove dist, .turbo, tsbuildinfo).

## Architecture & Structure

### Project Layout

This is a monorepo structure managed with pnpm workspaces.

- `apps/web/`: Main React web application (Vite); source under `apps/web/src/` (components, hooks, const, services, store).
- `apps/native/`: React Native (Expo) application.
- `packages/`: Shared libraries (map-core, tools, map-adapter-ol, map-adapter-maplibre, map-hooks, map-service, web-components, etc.).
- `public/`: Static assets (per app where used).
- `dist/`: Build output (do not edit).

### Tech Stack

- **Framework**: React 19, Vite
- **Language**: TypeScript
- **State Management**:
  - MobX (for complex domain state, e.g. map state)
- **Styling**: Tailwind CSS v4, SCSS (via sass-embedded), clsx/tailwind-merge
- **Animations**: GSAP, Motion (framer-motion replacement)
- **Internationalization**: i18next, react-i18next
- **Linting/Formatting**: ESLint, Prettier

### Key Patterns

- **Components**: Functional components with hooks. Use `PascalCase`.
- **State**: Hooks-first state management. Stores are typically singletons or provided via context.
- **Data**: Services in `src/services` handle data fetching and processing.
- **Styling**: Utility-first CSS with Tailwind. Complex animations use GSAP or Motion.

## Guidelines

- **TypeScript**: strict mode enabled. NO `any` type allowed. Prefer interfaces/types over loose objects.
- **Naming**:
  - Components: `PascalCase`
  - Files: `camelCase` (except components), e.g. `useMapStore.ts`
  - Variables/Functions: `camelCase`
- **Imports**: Use absolute imports or workspace aliases where configured.
- **Commits**: Follow Conventional Commits (e.g., `feat: ...`, `fix: ...`, `refactor: ...`).
