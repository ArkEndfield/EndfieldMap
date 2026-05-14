# 终末地地图站 · Arknights Endfield Map

> 《明日方舟：终末地》（Endfield）的交互式资源点位地图站 —— 在一个站点内查询全部素材采集点、掉落、NPC 与地标。
>
> 内部代号：`ZMDMAP` · [English README](./README.md)

本仓库是一个 pnpm monorepo，同时驱动 Web 地图站（`apps/web`）与共享的 Expo 客户端（`apps/native`），核心引擎抽象层可在 OpenLayers / MapLibre 两套实现之间切换。

<!-- ![screenshot](docs/screenshot.png) -->
<!-- TODO: 在线 Demo 链接 -->

---

## 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [脚本一览](#脚本一览)
- [环境变量](#环境变量)
- [架构要点](#架构要点)
- [国际化](#国际化)
- [参与贡献](#参与贡献)
- [开源协议](#开源协议)

---

## 功能特性

- **交互式资源地图**：点位可见性切换、搜索、用户「已标记」状态通过 RxDB 离线持久化。
- **双地图引擎**：`@endfieldmap/map-adapter-ol`（OpenLayers，默认）与 `@endfieldmap/map-adapter-maplibre`（MapLibre）镜像同一份 `map-core` API，使用方可自由替换。
- **14 语种 × 8 命名空间**：开箱即用，通过自动生成的 `resources.d.ts` 实现类型安全。
- **PWA 就绪**：`autoUpdate` Service Worker、离线缓存与应用内更新提示弹窗。
- **跨平台 packages**：同一套数据 / 服务层同时支撑 Vite SPA 与 Expo（React Native）客户端。
- **现代 React 技术栈**：React 19 + React Compiler、MobX class stores（装饰器 `2023-11`）、`motion` + GSAP 动画、Tailwind CSS v4。
- **生产级可观测性**：可选 Sentry 接入，构建时生成隐藏 source map 并在上传后自动清理 `.map` 残留。
- **Storybook UI 组件库**（`packages/web-components`）作为可独立发布的设计体系。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 包管理 / 构建编排 | pnpm `10.30.1` · Turborepo `2.8` · Changesets |
| 应用框架 | React `19.2` · Vite `8`（beta） · TypeScript `5.9`（strict） |
| 样式 | Tailwind CSS v4（`@tailwindcss/vite`） |
| 状态 / 数据 | MobX 6 · `mobx-react-lite` · RxDB 16 · Dexie storage · `@tanstack/react-db` |
| 动画 | `motion` 12（framer-motion 后继） · GSAP 3 + `@gsap/react` |
| i18n | i18next 25 · `react-i18next` · `LanguageDetector` |
| 地图引擎 | OpenLayers 10 · MapLibre（adapter 化、可选） |
| 网络 | 原生 `fetch`（无 axios），自封装 `ServerService`，JWT + 401 刷新队列 |
| PWA | `vite-plugin-pwa` · `workbox-window` |
| 可观测性 | Sentry React SDK · Sentry Vite plugin（条件启用） |
| 测试 | Vitest（覆盖 tools / map-core / map-service / storage-web / web-components 等共 30+ 测试文件） |
| Lint / 格式化 | ESLint 10 · `typescript-eslint` · `simple-import-sort` · Prettier 3 |
| 编译插件 | `babel-plugin-react-compiler` 1.0 · `@babel/plugin-proposal-decorators`（`'2023-11'`） |
| CI / 镜像 | GitHub Actions 同步至 CNB（`.github/workflows/push-cnb.yml`），实际部署在 CNB 侧执行 |

## 项目结构

```text
EndfieldMap/
├── apps/
│   ├── web/                     Vite SPA —— 主站
│   └── native/                  Expo（React Native）客户端
├── packages/                    11 个可发布库
│   ├── map-core                  与引擎无关的抽象层（entity / event / history / data）
│   ├── map-adapter-ol            OpenLayers 适配器
│   ├── map-adapter-maplibre      MapLibre 适配器
│   ├── map-service               跨平台数据层（API / i18n / RxDB）
│   ├── map-hooks                 跨平台 React hooks（useGuide、useMobxSource …）
│   ├── map-web-theme-types       主题 token 类型定义
│   ├── web-components            UI 组件库 + Storybook
│   ├── tools                     工具、日志、`IStorageAdapter` 接口
│   ├── storage-web               `localStorage` 实现（命名空间 `endfieldmap.`）
│   ├── storage-mmkv              React Native MMKV 实现
│   └── storage-expo-sqlite       Expo SQLite 实现
├── docs/                        规范文档（UI / 交互 / 数据流 / i18n / 性能）
├── scripts/                     release.sh
├── .changeset/                  apps 位于 `ignore` 列表，仅 packages 发布
├── AGENTS.md                    仓库协作规范
├── CLAUDE.md                    给代码 agent 的架构详解
├── turbo.json                   Turbo pipeline（构建走 `^build` 链）
├── tsconfig.base.json
├── pnpm-workspace.yaml          版本集中管理 catalog
└── package.json
```

## 快速开始

**环境要求**

- Node.js LTS 22+（Vite 8 / React 19 的要求）
- pnpm `10.30.1` 或更高 —— 推荐用 `corepack enable && corepack prepare pnpm@latest --activate`

**初始化**

```bash
git clone https://github.com/<your-org>/EndfieldMap.git
cd EndfieldMap
pnpm install

# Web 主站 —— Vite dev server，默认端口 5173
pnpm dev:web

# UI 组件库 —— packages/web-components 的 Storybook
pnpm dev:components

# Native 客户端 —— Expo Metro
pnpm dev:native        # 之后再 pnpm dev:android / pnpm dev:ios
```

启动开发服务器前，请在 `apps/web` 下将 `.env.example`（如存在）复制为 `.env.local`，至少设置 `VITE_BACKEND_HOST`。详见 [环境变量](#环境变量)。

**生产构建**

```bash
pnpm build              # 完整 Turbo pipeline
pnpm build:web          # 仅构建 Web SPA
pnpm preview:web        # 本地预览 apps/web/dist
```

**测试与 QA**

```bash
pnpm typecheck
pnpm lint               # 加 :fix 自动修复
pnpm test               # 通过 Turbo 跑整个 monorepo

# 只跑单个 package 的测试
pnpm --filter ./packages/map-core test
```

## 脚本一览

| 脚本 | 用途 |
| --- | --- |
| `pnpm dev:web` | 启动 `apps/web` 的 Vite dev server（实时 alias 到 `packages/*/src`） |
| `pnpm dev:native` / `dev:android` / `dev:ios` | Expo Metro 及平台变体 |
| `pnpm dev:components` | 启动 UI 组件库 Storybook |
| `pnpm preview:web` | 预览构建产物 `apps/web/dist` |
| `pnpm build` | 完整 Turbo 构建 |
| `pnpm build:web` / `build:packages` | 过滤后的 Turbo 构建 |
| `pnpm build:components` / `build:components:docs` | 组件库构建（+ Storybook 静态） |
| `pnpm build:adapter:ol` / `build:adapter:maplibre` | 单独构建一个地图适配器 |
| `pnpm build:android` / `build:ios` / `build:mobile` | 原生 release 构建 |
| `pnpm typecheck` | monorepo 级别 `tsc --noEmit` |
| `pnpm lint` / `lint:fix` | ESLint + Prettier |
| `pnpm test` | 全 packages 的 Vitest |
| `pnpm lng:type` | 从 locale JSON 重新生成 `packages/map-service/src/@types/resources.d.ts` |
| `pnpm changeset` | 录入 changeset |
| `pnpm version:packages` | 按已录 changeset 调整版本号 |
| `pnpm publish:packages` | 构建并执行 `changeset publish --access public` |
| `pnpm release` | Shell 入口（`scripts/release.sh`） |
| `pnpm clean` | 清理所有 `dist/`、`.turbo/`、`*.tsbuildinfo` |

## 环境变量

写入 `apps/web/.env.local`（Vite 前缀变量）或 CI 构建环境。

| 变量名 | 必填 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `VITE_BACKEND_HOST` | 是 | `ServerService` 使用的后端 API origin | —— |
| `VITE_ASSETS_HOST` | 否 | CDN / 资源 origin；为空时回退到后端 | _空_ |
| `VITE_SENTRY_DSN` | 否 | 运行时上报用的 Sentry DSN | _关闭_ |
| `SENTRY_AUTH_TOKEN` | 仅 production build | 启用 source map 上传所需 | _关闭_ |
| `SENTRY_ORG` | 仅 production build | Sentry 组织 slug（需与 token 配套） | _关闭_ |
| `SENTRY_PROJECT` | 仅 production build | Sentry 项目 slug（需与 token 配套） | _关闭_ |
| `SENTRY_URL` | 否 | 自托管 Sentry 的覆盖地址 | `sentry.io` |
| `CNB_BUILD_ID` / `GITHUB_SHA` | 否 | 注入为 `__COMMIT_HASH__` | `'dev'` |

> 仅当 `SENTRY_AUTH_TOKEN`、`SENTRY_ORG`、`SENTRY_PROJECT` **同时** 存在时，Sentry source map 上传才会启用；否则插件静默跳过。

调试阶段可用的 URL 参数：

- `?__DEV__=true` —— 在任意构建中强制启用 dev-only 诊断。
- `?__SCAN__=true` —— 启用 [react-scan](https://react-scan.com) overlay。

## 架构要点

- **四层包模型**：抽象 core、可替换适配器、跨平台服务、平台 / UI。apps 通过 `IStorageAdapter` 与服务单例进行装配。
- **引擎无关的地图**：`map-core` 仅提供实体、事件总线、历史与数据管理器，**不包含**任何渲染代码；适配器（`map-adapter-ol`、`map-adapter-maplibre`）将 API 绑定到具体渲染器，`apps/web` 当前消费 OL 适配器。
- **单页、无路由**：`apps/web/src/main.tsx` 启动服务并在 `Suspense` 内懒加载 `<Map />`，进度通过 `loadingManager` 上报。
- **带刷新队列的鉴权**：所有 HTTP 走 `ServerService.request`；token 刷新进行中时，并发请求会挂载到同一个 promise，待新 token 拿到后自动重放。
- **Vite manual chunks**：拆分为 `react-vendor`、`state-vendor`、`ui-vendor`、`map-vendor`、`i18n-vendor`、`sentry-vendor` 等。新增大依赖时应分配到对应桶。

更完整的深入说明（状态 stores、设备分支、动画规则、构建管线、约定）见 **[`CLAUDE.md`](./CLAUDE.md)** 与 **[`docs/`](./docs)** 下的规范文档。

## 国际化

文案源头位于 `packages/map-service/src/locales/<locale>/<namespace>.json`。

**支持语种**（14）：`de-DE`、`en-US`、`es-MX`、`fr-FR`、`id-ID`、`it-IT`、`ja-JP`、`ko-KR`、`pt-BR`、`ru-RU`、`th-TH`、`vi-VN`、`zh-CN`、`zh-TW`。

**命名空间**（8）：`agreement`、`common`、`error`、`header`、`lang`、`popup`、`settings`、`sidebar`。默认命名空间为 `common`；fallback 语言为 `zh-CN`。

**新增一条文案**

1. 编辑对应 `<locale>/<namespace>.json`。
2. 运行 `pnpm lng:type` 重新生成 `packages/map-service/src/@types/resources.d.ts`。
3. 在代码中使用 `t('namespace:key')`，TypeScript 会校验 key 是否合法。

跳过第 2 步会通过 lint 但在 CI 的 `tsc --noEmit` 阶段失败。

## 参与贡献

1. 先阅读 **[`AGENTS.md`](./AGENTS.md)**（仓库协作规范）与 **[`CLAUDE.md`](./CLAUDE.md)**（架构）。
2. 从 `main` 分出 `feature/*`、`fix/*` 或 `chore/*` 分支。
3. 遵循 **Conventional Commits**（`feat:`、`fix:`、`refactor:`、`docs:`、`chore:` …）。历史中英文 subject 均被接受，请与所在区域保持一致。
4. 改动涉及 `packages/*` 时，请录入 changeset：
   ```bash
   pnpm changeset
   ```
   `apps/web` 与 `apps/native` 在 changesets 的 `ignore` 列表内并独立 version，仅改 apps 时**不需要** changeset。
5. 提 PR 前请运行 `pnpm lint` 与相关 `pnpm --filter <pkg> test`。
6. 涉及 UI 的改动请附带截图 / GIF。

## 开源协议

本项目以 **GNU Affero General Public License v3.0** 协议发布 —— 详见 [`LICENSE`](./LICENSE)。若以网络服务形式运行本项目的修改版本，AGPL 要求你向其用户公开你的修改源码。
