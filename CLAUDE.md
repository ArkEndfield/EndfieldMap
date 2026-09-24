# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

`pnpm@11` (`packageManager` in root `package.json`; CI's global pnpm switches to it) + Turborepo orchestrate everything; never run `npm`/`yarn`. pnpm 11 refuses versions published less than 24 h ago, and the lockfile must stay `--frozen-lockfile`-installable for CI.

**Dev**

- `pnpm dev:web` — Vite dev server for `apps/web` (uses source-level alias from `packages/*/src`, so changes hot-reload across the monorepo).
- `pnpm dev:native` — Expo Metro for `apps/native`. Variants: `dev:android` / `dev:ios` / `dev:android:local` / `dev:ios:local` / `dev:components` (Storybook for `web-components`).
- `pnpm preview:web` — serve the built `apps/web/dist`.

**Build**

- `pnpm build` — Turbo full pipeline (`^build` first).
- Filtered: `build:web` / `build:packages` (everything except apps) / `build:components` / `build:components:docs` / `build:adapter:ol` / `build:adapter:maplibre` / `build:android` / `build:ios` / `build:mobile`.
- `apps/web` build runs `tsc -p tsconfig.app.json --noEmit && vite build`; library packages use their own `tsconfig.build.json`.

**QA**

- `pnpm typecheck` / `pnpm lint` / `pnpm lint:fix` / `pnpm test` — all go through `turbo run …` so caching is automatic.
- Per-package run, e.g. `pnpm --filter ./packages/map-core test` or `pnpm --filter ./packages/map-service test -- guide.test`.
- `pnpm lng:type` — regenerate `packages/map-service/src/@types/resources.d.ts` from JSON locale files (must run after editing any `locales/<lang>/<ns>.json`).

**Release**

- `pnpm changeset` to add a changeset; `pnpm version:packages` to roll versions; `pnpm publish:packages` to publish to npm.
- `apps/web` and `apps/native` are listed under `.changeset/config.json` → `ignore`; only the 11 packages publish. Apps version separately.
- `pnpm release` (calls `scripts/release.sh`) is the bash entry point.

**Cleanup**

- `pnpm clean` — wipes `dist/`, `.turbo/`, `*.tsbuildinfo` across the whole monorepo.

## Architecture

### Layout

- `apps/web` — Vite + React 19 SPA (the actual map site).
- `apps/native` — Expo app sharing the same `packages/*`.
- `packages/` — 11 publishable libs split into four layers:
  1. **Core / abstract**: `map-core` (entities, event emitter, history, asset, data instance/manager, search registry).
  2. **Adapters**: `map-adapter-ol` and `map-adapter-maplibre` — pluggable map implementations against `map-core`'s API. Only one is consumed by `apps/web` (currently `ol`).
  3. **Services / data**: `map-service` (API, RxDB, i18n, presets, user data), `map-hooks` (cross-platform React hooks like `useGuide`, `useMobxSource`, `useCurrentLanguage`).
  4. **Platform / UI**: `web-components` (Storybook UI kit), `map-web-theme-types` (theme token types), `storage-{web,mmkv,expo-sqlite}` (`IStorageAdapter` impls), `tools` (logger / utils / storage interface).
- Build outputs (`dist/`) and `.turbo/` are never hand-edited; `pnpm clean` covers both.

### `apps/web` runtime flow

1. `src/main.tsx` boots: registers `WebStorageAdapter`, disables pinch zoom, optionally enables `react-scan`, then mounts `<App />`. The same file also defines and exports `SWUpdatePrompt` (the PWA update modal whose text is picked by `navigator.language`, **not** the i18n system).
2. `src/App.tsx` renders `<LoadingScreen />` + `<SWUpdatePrompt />` and `React.lazy`-imports `<Map />` inside `Suspense`. Each lazy step reports progress to `loadingManager` (`COMPONENTS` stage). There is **no router** — the app is single-page.
3. `src/Map.tsx` brings up the chosen theme (`components/themes/endfield/...`); device branching is done per-component via the `deviceJudge` HOC.

### Cross-platform vs web-specific code

- `apps/web/src/services/` — **web-only side effects**: `LoadingManager`, `UIManager`, `Logger` (Sentry integration), `MapService` (adapter init + region-name i18n), `service_event_bridge` (map-core events → React), cursor / context-menu helpers.
- `packages/map-service/src/service/` — **cross-platform data layer**: `ServerService` (fetch + token + 401 queue), `I18nService`, `PresetService`, `AssetService`, `AdapterRegistry`, RxDB collections (`db/`, `user/data/{visibility,marked}/`).
- Stay on the correct side of this boundary. UI / DOM / window-only concerns go in `apps/web/src/services`. Anything reusable across web and native goes in `packages/map-service` (and uses `IStorageAdapter` instead of `localStorage`).

### State

- **MobX** with class-based stores using decorators (Babel `@babel/plugin-proposal-decorators` `version: '2023-11'`). Subscribe in React via `mobx-react-lite` or the `useMobxSource` hook in `map-hooks`.
- **RxDB** is the cross-platform offline store; `@tanstack/react-db` + `@tanstack/rxdb-db-collection` adapt collections to React.
- Two singleton service hubs:
  - `apps/web/src/services/index.ts` constructs and wires the web services (and exposes `i18nConfig` for i18next init).
  - `packages/map-service` services use module-level singletons (e.g., `ServerService` instance) — call setters (`setToken`, `setUnauthorizedHandler`) from app init to inject behavior.

### Auth / Network

- All HTTP goes through `packages/map-service/src/service/server.ts` (`ServerService`, **no axios — native fetch**).
- 401 handling owns a refresh queue: while `isRefreshing` is true, in-flight requests park on a promise and replay with the new token. `setUnauthorizedHandler` fires only when refresh itself returns 401 (the "real" logout signal). When adding new endpoints, always go through `ServerService.request` (or wrappers like `apiRequest`) — bypassing it loses the refresh queue.
- The backend's standard envelope is `{ code, message, data }`. Backend error codes are grouped by domain (e.g., `80001–80999` for the guide / marker module).

### Storage abstraction

- One interface (`IStorageAdapter`, in `@endfieldmap/tools`) implemented three ways: `storage-web` (`localStorage` namespaced by `'endfieldmap.'`), `storage-mmkv` (React Native), `storage-expo-sqlite` (Expo SQLite for native overrides). Pick the adapter at app boot; `packages/*` never touch `localStorage` directly.

### Map adapters

- `map-core` is implementation-free: entity types, event emitter, history manager, data managers.
- `map-adapter-ol` and `map-adapter-maplibre` mirror each other's API surface and are independently buildable (`pnpm build:adapter:ol` / `pnpm build:adapter:maplibre`) — they ship to npm separately so downstream consumers can pick one. `apps/web` aliases only the OL adapter in dev mode.

### Themes & device branching

- Single theme tree under `apps/web/src/components/themes/endfield/`. `EndfieldThemeRootProvider` wires Context + an `EndfieldUIManager` singleton.
- PC/Mobile splits use `deviceJudge(PCComponent, MobileComponent, ExtraWrapper?)` (`apps/web/src/components/common/device_judge.tsx`), which reads `useIsMobile()` from `@endfieldmap/web-components`. The breakpoint is hard-coded at `matchMedia('(max-width: 768px)')` — when adding a new responsive component, follow this split rather than inventing per-component breakpoints.

### Animation

- **`motion`** (the framer-motion successor) for component-level transitions (`AnimatePresence`, layout, gestures). Default first.
- **GSAP** + `@gsap/react` for timeline-driven, text-shuffle, and other complex sequences (e.g., `shuffle_text.tsx`).
- Don't mix them on the same node. Tailwind utilities cover linear animations (`animate-spinner-*`, `animate-marquee`, `rotate3d` are defined in `apps/web/src/index.css`).

### i18n

- Source of truth: `packages/map-service/src/locales/<locale>/<namespace>.json`.
- 14 locales: `de-DE, en-US, es-MX, fr-FR, id-ID, it-IT, ja-JP, ko-KR, pt-BR, ru-RU, th-TH, vi-VN, zh-CN, zh-TW`. `bundled.ts` is the aggregator, not a locale.
- 8 namespaces: `agreement, common, error, header, lang, popup, settings, sidebar`. `defaultNS = 'common'`, `fallbackLng = 'zh-CN'` (`packages/map-service/src/service/i18n.ts:30,54`).
- After any JSON edit run `pnpm lng:type` — it regenerates `packages/map-service/src/@types/resources.d.ts` so `t('ns:key')` stays type-safe. Skipping this breaks `tsc --noEmit`.

### Build pipeline highlights (`apps/web/vite.config.ts`)

- Babel pipeline (`@vitejs/plugin-react` 6 no longer runs Babel; `@rolldown/plugin-babel` does): `reactCompilerPreset()` (auto-memoization), `@babel/plugin-proposal-decorators` `'2023-11'`, `@babel/plugin-transform-class-properties` `loose:true`, `@babel/plugin-transform-class-static-block`. Presets run last-to-first, so the compiler preset is listed last to keep it first; library packages use the same plugins without the compiler.
- `manualChunks` strategy is explicit: `rxjs-vendor`, `rxdb-vendor`, `tanstack-db-vendor`, `react-vendor`, `state-vendor` (mobx), `ui-vendor` (motion + gsap), `i18n-vendor`, `map-vendor` (ol), `swiper-vendor`, `sentry-vendor`, `lightbox-vendor`. When adding a large dep, decide which bucket it falls into.
- **Sentry is opt-in by env**: `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` all required. When enabled, source maps build as `'hidden'` and a custom `cleanup-residual-sourcemaps` plugin deletes leftover `.map` files after upload. Locally you'll never hit this path.
- **PWA**: `registerType: 'autoUpdate'` + manifest baked in (`name: '终末地地图资源查询 - ZMDMAP'`). `workbox-window` must remain an explicit `devDependency` of `apps/web` — Rolldown's externalization check rejects the implicit transitive import.
- `define`d `__COMMIT_HASH__` / `__BUILD_TIME__` come from `CNB_BUILD_ID || GITHUB_SHA` and `new Date().toISOString()` at build time. `allowedHosts: ['.cnb.run']` is for the CNB preview environment.
- `resolve.alias`: dev mode aliases `@endfieldmap/*` to package `src/` for live editing; production lets pnpm symlinks resolve. The three local aliases (`@`, `@eftypes`, `@themes`) work in both modes.

## Conventions

- **TypeScript strict, NO `any`** (`@typescript-eslint/no-explicit-any: 'error'` in `eslint.config.js`). Prefer interfaces/types over inline shapes.
- **Prettier**: 2-space indent, single quotes, `printWidth: 120`, `trailingComma: 'es5'`, `arrowParens: 'always'`. Don't override per-file.
- **Imports**: `simple-import-sort/imports` and `/exports` are `warn` — fix with `pnpm lint:fix`. Use absolute (`@/...`, `@themes/...`, `@endfieldmap/...`) over deep relatives.
- **Naming**: Components `PascalCase`; everything else `camelCase` (file `useMapStore.ts`, not `UseMapStore.ts`).
- **Commits**: Conventional Commits. Both Chinese and English subject lines are accepted historically; match what neighboring commits in the same area use.
- **Don't add deps casually** (`AGENTS.md`). When you do, decide its `manualChunks` bucket and verify the lockfile only changes the intended packages.

## Generated / Do-not-edit

- `packages/map-service/src/@types/resources.d.ts` — regenerated by `pnpm lng:type`.
- `dist/`, `.turbo/`, `*.tsbuildinfo` under every package — wiped by `pnpm clean`.
- `pnpm-lock.yaml` — never hand-edit; let pnpm regenerate.

## Pitfalls

- Editing a locale JSON without running `pnpm lng:type` will pass lint but fail `tsc` in CI.
- Adding a new responsive split via inline media queries instead of `deviceJudge` will desync from the rest of the app (768px breakpoint lives only in `useIsMobile`).
- Calling `localStorage` directly from `packages/*` breaks native — go through `IStorageAdapter`.
- Adding a new vendor dep without updating `manualChunks` lands it in the default chunk, often regressing initial-load size noticeably.
- Mixing GSAP and Motion on the same DOM node fights for transform/opacity ownership; pick one per node.
