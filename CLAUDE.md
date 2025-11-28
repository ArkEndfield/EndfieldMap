# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Development**: `pnpm dev` (starts Vite dev server)
- **Build**: `pnpm build` (builds tools, map-core, and web app)
  - Build core only: `pnpm build:core`
  - Build tools only: `pnpm build:tools`
  - Build web app only: `pnpm build:web`
- **Linting**: `pnpm lint` (runs ESLint)
  - Fix lint issues: `pnpm lint:fix` (runs Prettier and ESLint fix)
- **Testing**:
  - Run all tests: `pnpm test` (if configured in root) or run per package
  - map-core tests: `cd packages/map-core && pnpm test`
  - tools tests: `cd packages/tools && pnpm test`
- **Preview**: `pnpm preview` (serve production build locally)
- **i18n**: `pnpm lng:type` (generate i18next types)

## Architecture & Structure

### Project Layout
This is a monorepo structure managed with pnpm workspaces.
- `src/`: Main React web application
  - `components/`: Reusable UI components
  - `hooks/`: Custom React hooks
  - `const/`: Shared constants and configuration
  - `services/`: Data fetching and business logic
  - `store/`: State management stores
- `packages/`: Shared libraries
  - `map-core/`: Core mapping logic and data structures
  - `tools/`: Utility functions and build tools
- `public/`: Static assets
- `dist/`: Build output (do not edit)

### Tech Stack
- **Framework**: React 19, Vite
- **Language**: TypeScript
- **State Management**:
  - MobX (for complex domain state, e.g. map state)
  - Zustand (for lighter UI state)
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
