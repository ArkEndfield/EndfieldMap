# Arknights Endfield Map

> Interactive resource-point map for **Arknights: Endfield** — a one-stop site to find every collectible, drop, NPC and landmark on the in-game world map.
>
> Internal name: `ZMDMAP` / 终末地地图站 · [中文版 README](./README-CN.md)

A pnpm monorepo powering both the web map site (`apps/web`) and a shared Expo app (`apps/native`), built on a pluggable map-engine core that targets OpenLayers and MapLibre interchangeably.

<!-- ![screenshot](docs/screenshot.png) -->
<!-- TODO: live demo link -->

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)
- [Architecture Highlights](#architecture-highlights)
- [Internationalization](#internationalization)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Interactive resource map** with marker visibility, search, and per-user "marked" state persisted offline via RxDB.
- **Dual map engines** — `@endfieldmap/map-adapter-ol` (OpenLayers, default) and `@endfieldmap/map-adapter-maplibre` (MapLibre), both mirroring the same `map-core` API so consumers can swap implementations.
- **14 locales × 8 namespaces** out of the box, type-safe via generated `resources.d.ts`.
- **PWA-ready** with `autoUpdate` service worker, offline cache and an in-app update prompt.
- **Cross-platform packages** — the same data/service layer drives the Vite SPA and an Expo (React Native) client.
- **Modern React stack** — React 19 + the React Compiler, MobX class stores (decorators `2023-11`), `motion` + GSAP animations, Tailwind CSS v4.
- **Production observability** — opt-in Sentry integration with hidden source maps and automatic post-upload `.map` cleanup.
- **Storybook UI kit** (`packages/web-components`) shipped as an installable design system.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Package manager / build orchestration | pnpm `10.30.1` · Turborepo `2.8` · Changesets |
| App framework | React `19.2` · Vite `8` (beta) · TypeScript `5.9` (strict) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| State / data | MobX 6 · `mobx-react-lite` · RxDB 16 · Dexie storage · `@tanstack/react-db` |
| Animation | `motion` 12 (framer-motion successor) · GSAP 3 + `@gsap/react` |
| i18n | i18next 25 · `react-i18next` · `LanguageDetector` |
| Map engines | OpenLayers 10 · MapLibre (adapter-based, optional) |
| Networking | Native `fetch` (no axios) · custom `ServerService` with JWT + 401 refresh queue |
| PWA | `vite-plugin-pwa` · `workbox-window` |
| Observability | Sentry React SDK · Sentry Vite plugin (conditional) |
| Testing | Vitest (30+ test files across tools / map-core / map-service / storage-web / web-components) |
| Lint / format | ESLint 10 · `typescript-eslint` · `simple-import-sort` · Prettier 3 |
| Build plugins | `babel-plugin-react-compiler` 1.0 · `@babel/plugin-proposal-decorators` (`'2023-11'`) |
| CI / mirror | GitHub Actions → CNB sync (`.github/workflows/push-cnb.yml`); deployment runs on the CNB side |

## Project Structure

```text
EndfieldMap/
├── apps/
│   ├── web/                     Vite SPA — the public map site
│   └── native/                  Expo (React Native) client
├── packages/                    11 publishable libraries
│   ├── map-core                  Engine-agnostic abstractions (entity / event / history / data)
│   ├── map-adapter-ol            OpenLayers adapter
│   ├── map-adapter-maplibre      MapLibre adapter
│   ├── map-service               Cross-platform data layer (API / i18n / RxDB)
│   ├── map-hooks                 Shared React hooks (useGuide, useMobxSource, …)
│   ├── map-web-theme-types       Theme-token TypeScript types
│   ├── web-components            UI kit + Storybook
│   ├── tools                     Utilities, logger, `IStorageAdapter` interface
│   ├── storage-web               `localStorage` adapter (namespace `endfieldmap.`)
│   ├── storage-mmkv              React Native MMKV adapter
│   └── storage-expo-sqlite       Expo SQLite adapter
├── docs/                        Specification documents (UI / interaction / data flow / i18n / perf)
├── scripts/                     release.sh
├── .changeset/                  apps are in the `ignore` list; only packages publish
├── AGENTS.md                    Repository guidelines
├── CLAUDE.md                    Architecture deep-dive for code agents
├── turbo.json                   Turbo pipeline (build follows `^build` chain)
├── tsconfig.base.json
├── pnpm-workspace.yaml          Centralised version catalog
└── package.json
```

## Quick Start

**Prerequisites**

- Node.js LTS 22+ (required by Vite 8 / React 19)
- pnpm `10.30.1` or newer — install via `corepack enable && corepack prepare pnpm@latest --activate`

**Bootstrap**

```bash
git clone https://github.com/<your-org>/EndfieldMap.git
cd EndfieldMap
pnpm install

# Web app — Vite dev server, default port 5173
pnpm dev:web

# UI kit — Storybook for packages/web-components
pnpm dev:components

# Native app — Expo Metro
pnpm dev:native        # then pnpm dev:android / pnpm dev:ios
```

Before the dev server starts, copy `.env.example` (if present) to `.env.local` under `apps/web` and set at least `VITE_BACKEND_HOST`. See [Environment Variables](#environment-variables).

**Production build**

```bash
pnpm build              # full Turbo pipeline
pnpm build:web          # web SPA only
pnpm preview:web        # serve apps/web/dist locally
```

**Testing & QA**

```bash
pnpm typecheck
pnpm lint               # add :fix to auto-format
pnpm test               # whole monorepo via Turbo

# Run a single package's tests
pnpm --filter ./packages/map-core test
```

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev:web` | Vite dev server for `apps/web` (live-aliased to `packages/*/src`) |
| `pnpm dev:native` / `dev:android` / `dev:ios` | Expo Metro and platform variants |
| `pnpm dev:components` | Storybook for the UI kit |
| `pnpm preview:web` | Serve the built `apps/web/dist` |
| `pnpm build` | Full Turbo build pipeline |
| `pnpm build:web` / `build:packages` | Filtered Turbo builds |
| `pnpm build:components` / `build:components:docs` | UI kit build (+ Storybook static) |
| `pnpm build:adapter:ol` / `build:adapter:maplibre` | Build a single map adapter |
| `pnpm build:android` / `build:ios` / `build:mobile` | Native release builds |
| `pnpm typecheck` | `tsc --noEmit` across the monorepo |
| `pnpm lint` / `lint:fix` | ESLint + Prettier |
| `pnpm test` | Vitest across every package |
| `pnpm lng:type` | Regenerate `packages/map-service/src/@types/resources.d.ts` from locale JSON |
| `pnpm changeset` | Author a changeset |
| `pnpm version:packages` | Roll versions per pending changesets |
| `pnpm publish:packages` | Build + `changeset publish --access public` |
| `pnpm release` | Shell entry point (`scripts/release.sh`) |
| `pnpm clean` | Wipe `dist/`, `.turbo/`, `*.tsbuildinfo` everywhere |

## Environment Variables

Place these in `apps/web/.env.local` (Vite-prefixed vars) or your CI build environment.

| Name | Required | Description | Default |
| --- | --- | --- | --- |
| `VITE_BACKEND_HOST` | Yes | Backend API origin used by `ServerService` | — |
| `VITE_ASSETS_HOST` | No | CDN/asset origin; falls back to backend if empty | _empty_ |
| `VITE_SENTRY_DSN` | No | Sentry DSN for runtime error reporting | _disabled_ |
| `SENTRY_AUTH_TOKEN` | Production only | Required to enable source-map upload at build time | _disabled_ |
| `SENTRY_ORG` | Production only | Sentry org slug (paired with the token) | _disabled_ |
| `SENTRY_PROJECT` | Production only | Sentry project slug (paired with the token) | _disabled_ |
| `SENTRY_URL` | No | Override for self-hosted Sentry | `sentry.io` |
| `CNB_BUILD_ID` / `GITHUB_SHA` | No | Injected as `__COMMIT_HASH__` into the build | `'dev'` |

> Sentry source-map upload only runs when **all three** of `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` are present; otherwise the plugin is skipped silently.

Useful URL flags during development:

- `?__DEV__=true` — force-enable dev-only diagnostics in any build.
- `?__SCAN__=true` — enable [react-scan](https://react-scan.com) overlay.

## Architecture Highlights

- **Four-layer package model** — abstract core, swappable adapters, cross-platform services, platform/UI. Apps assemble these via `IStorageAdapter` + service singletons.
- **Engine-agnostic map** — `map-core` ships entities, an event emitter, a history manager and a data manager with **no** rendering code. Adapters (`map-adapter-ol`, `map-adapter-maplibre`) bind the API to a concrete renderer; `apps/web` currently consumes the OL adapter.
- **Single-page, no router** — `apps/web/src/main.tsx` boots services and lazy-loads `<Map />` inside `Suspense`, reporting progress to `loadingManager`.
- **Auth with refresh queue** — every HTTP call goes through `ServerService.request`; while a token refresh is in flight, requests park on a promise and replay automatically.
- **Vite manual chunks** — split into `react-vendor`, `state-vendor`, `ui-vendor`, `map-vendor`, `i18n-vendor`, `sentry-vendor`, etc. New large deps should be assigned to a bucket.

For the full deep-dive (state stores, device branching, animation rules, build pipeline, conventions) see **[`CLAUDE.md`](./CLAUDE.md)** and the specification documents under **[`docs/`](./docs)**.

## Internationalization

Source of truth lives in `packages/map-service/src/locales/<locale>/<namespace>.json`.

**Supported locales** (14): `de-DE`, `en-US`, `es-MX`, `fr-FR`, `id-ID`, `it-IT`, `ja-JP`, `ko-KR`, `pt-BR`, `ru-RU`, `th-TH`, `vi-VN`, `zh-CN`, `zh-TW`.

**Namespaces** (8): `agreement`, `common`, `error`, `header`, `lang`, `popup`, `settings`, `sidebar`. Default namespace is `common`; fallback language is `zh-CN`.

**Adding a string**

1. Edit the JSON under the matching `<locale>/<namespace>.json` files.
2. Run `pnpm lng:type` to regenerate `packages/map-service/src/@types/resources.d.ts`.
3. Use `t('namespace:key')` — TypeScript will validate the key.

Skipping step 2 passes lint but fails `tsc --noEmit` in CI.

## Contributing

1. Read **[`AGENTS.md`](./AGENTS.md)** for repository guidelines and **[`CLAUDE.md`](./CLAUDE.md)** for architecture.
2. Branch from `main` using a `feature/*`, `fix/*` or `chore/*` prefix.
3. Follow **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:` …). English and Chinese subject lines are both accepted historically — match the surrounding area.
4. For changes that touch `packages/*`, add a changeset:
   ```bash
   pnpm changeset
   ```
   `apps/web` and `apps/native` are in the changesets `ignore` list and version independently — no changeset needed for app-only changes.
5. Run `pnpm lint` and the relevant `pnpm --filter <pkg> test` before opening a PR.
6. Include screenshots/GIFs for any UI-visible change.

## License

Released under the **GNU Affero General Public License v3.0** — see [`LICENSE`](./LICENSE). If you run a modified version of this project as a network service, the AGPL requires you to make your modifications available to its users.
