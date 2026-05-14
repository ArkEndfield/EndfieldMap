# PERF-AUDIT.md — 性能与潜在 Bug 审计

> 本次审计聚焦 **`apps/web` 首屏加载性能** 与 **跨包潜在 Bug**。每条记录都附精确文件 + 行号，便于核对、回归与拆 PR。
>
> 审计版本：`main` 分支（commit `537336e fix: sw 更新提示` HEAD 时）。
> 范围：`apps/web`、`packages/map-service`、`packages/storage-web`、根构建配置。
> 与本文档配套：[CLAUDE.md](../CLAUDE.md)、[docs/DATA-FLOW.md](./DATA-FLOW.md)、[docs/UI-GUIDELINES.md](./UI-GUIDELINES.md)、[docs/INTERACTION.md](./INTERACTION.md)、[docs/I18N.md](./I18N.md)。

## 0. TL;DR

| 类别 | 计数 | 影响 |
|---|---|---|
| 首屏 P0 | 9 | LCP / FCP / 首次 SW 安装尺寸；最大单项 17 MB precache、Google Fonts 阻塞 |
| Bug P0 / P1 | 14 | 1 个 PWA 大图标 404、1 个 401 边角递归、若干 UX 不一致 |

最大杠杆 5 项（详见第 3 节优先级表）：

1. 修 manifest 512 图标 typo（1 行 → 修复 PWA 大图标 404）
2. 删 `appType: 'mpa'`（1 行 → SPA 路由 / preload 行为正常）
3. PWA `includeAssets` 删 `images/**`（1 行 → 首次 SW 安装从 ~17 MB → ~1 MB）
4. Sentry / react-scan / Lightbox 改异步 `import()`（~30 行 → 主 bundle 减 100-150 KB gzip）
5. Google Fonts 自托管子集 + preload（2 文件 → LCP 减 200-1000 ms）

---

## 1. 首屏加载性能（按风险排序）

### P0-1 ⚠️ Google Fonts `@import url` 渲染阻塞 + 中文字体多权重

- **位置**：`apps/web/src/index.css:1`
- **现状**：

  ```css
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100..900&family=Noto+Serif+SC:wght@200..900&family=Outfit:wght@100..900&family=Roboto:wght@300;400;500;700&display=swap');
  ```

- **问题**：
  1. `@import` 在 CSS 顶部 → 渲染阻塞，并且 fonts.googleapis.com 在 CN 区域不稳定
  2. 两份全字重的思源黑体 / 思源宋体（CJK），即便 unicode-range 子集，单字重也 200-500 KB
  3. 实际项目使用的字重远少于声明的（常用只有 400/500/700）
- **修法**：
  - 移除 `@import url(...)`
  - 在 `apps/web/index.html` 加 `<link rel="preconnect">` + `<link rel="preload" as="font" type="font/woff2" crossorigin>` 关键字重
  - 改为自托管字体子集（pinyin / zh-hans 核心字范围），加 `font-display: swap`
  - 只引 Noto Sans SC 400/500/700、Noto Serif SC 400/700、Outfit 400/600、Roboto 400/500
- **收益**：LCP -200 ~ -1000 ms，关闭外网字体依赖

### P0-2 ⚠️ PWA 首次安装 precache 约 17 MB

- **位置**：`apps/web/vite.config.ts:72`
- **现状**：

  ```ts
  includeAssets: ['favicon.ico', 'locales/**/*.json', 'images/**/*.png', 'images/**/*.jpg', 'images/**/*.svg']
  ```

- **证据**：上次成功 build 日志：

  ```
  PWA v1.2.0
  mode      generateSW
  precache  153 entries (17606.39 KiB)
  ```

- **问题**：移动 4G 首次访问触发 SW 安装时会静默后台下载 17 MB，跟首屏请求抢带宽；弱网下 SW 安装超时 → 后续访问得不到离线缓存
- **修法**：
  - 从 `includeAssets` 删除 `images/**/*`
  - 改用 workbox `runtimeCaching` 规则：图片走 `CacheFirst` + `expiration`（条件式按访问缓存）
  - `locales/**/*.json` 可保留（每个 ~几十 KB），也建议改 runtime
- **收益**：首次 SW 安装从 ~17 MB 降到 ~1 MB

### P0-3 ⚠️ i18n lang chunk 共 14 份，最大单文件 1.86 MB（gzip 451 KB）

- **位置**：`apps/web/src/services/index.ts:12-13` + `apps/web/vite.config.ts:114-160`
- **证据**：`apps/web/dist/assets/lang-*.js` 数量 14，多个 >500 KB（vite 已给 warning）
- **现状**：`import.meta.glob('../../../../packages/map-service/src/locales/**/*.json')` 是 lazy（每个 key 是 fn），但 `manualChunks` 没把不同 locale 拆开，**导致所有语种被合并到 `lang` 这条统一规则下，按文件名 hash 拆为 14 个 chunk**，且每个 chunk 里也可能包含跨 namespace 的 JSON
- **修法**：
  - `manualChunks` 显式按 locale 切分：`if (id.includes('/locales/zh-CN/')) return 'lang-zh-CN'` 等
  - 加载层改 `import(\`../../../../packages/map-service/src/locales/${locale}/${ns}.json\`)`（动态字符串模板）以便 vite 单文件分包
  - 考虑只 preload 用户当前 locale 的 namespace，其余空闲时再 prefetch
- **收益**：单用户首屏 i18n 体积从可能加载多个 chunk 降到 ~1 个 chunk × 8 namespace ≈ 100-200 KB

### P0-4 ⚠️ Sentry SDK 顶层静态 import → 进入主 bundle

- **位置**：
  - `apps/web/src/main.tsx:1` `import '@/services/logger.ts';`（main entry 第一行）
  - `apps/web/src/services/logger.ts:2` `import * as Sentry from '@sentry/react';`
- **现状**：`Sentry.init()` 在 `logger.ts:9` 用 `!isDev` 条件初始化，但 `@sentry/react` + `@sentry/browser` + `replayIntegration`（**整包 ~80 KB gzip**）已经因为顶层 import 进了主 chunk
- **修法**：

  ```ts
  // logger.ts (production)
  if (!isDev && sentryDsn) {
    const Sentry = await import('@sentry/react');
    Sentry.init({...});
    logger.addReporter(Sentry.createConsolaReporter());
  }
  ```

- **收益**：主 bundle 减 ~80 KB gzip；Sentry 进入独立 `sentry-vendor` chunk

### P0-5 yet-another-react-lightbox 在 guide 弹窗组件里静态 import

- **位置**：`apps/web/src/components/common/guide/index.tsx:9-13`
- **现状**：

  ```ts
  import Lightbox, { type ControllerRef, type Slide } from 'yet-another-react-lightbox';
  import Captions from 'yet-another-react-lightbox/plugins/captions';
  import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
  import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
  import Zoom from 'yet-another-react-lightbox/plugins/zoom';
  import 'yet-another-react-lightbox/styles.css';
  ```

- **问题**：guide 组件本身不是首屏组件（用户点击标点才打开），但静态 import 把它和 4 个 plugin + CSS 拉进了同步依赖图
- **修法**：

  ```tsx
  const Lightbox = React.lazy(() => import('yet-another-react-lightbox'));
  // CSS 可继续静态（很小），或同步动态 import('yet-another-react-lightbox/styles.css')
  ```

- **收益**：主 bundle 减 ~30-50 KB gzip

### P0-6 `appType: 'mpa'` 设错

- **位置**：`apps/web/vite.config.ts:43`
- **现状**：`appType: 'mpa'`
- **问题**：项目是 SPA（App.tsx 单入口 + `React.lazy(Map)`，无路由），但配置为 MPA → dev 服务器禁用 history-api-fallback；PWA 安装后深链接刷新可能 404；某些 vite 内部 SPA 优化（如 preload-helper 行为）也会变化
- **修法**：删除该字段（默认值即 `'spa'`）

### P0-7 react-scan 静态 import

- **位置**：`apps/web/src/main.tsx:9` `import { scan } from 'react-scan';`
- **现状**：仅当 URL 带 `?__SCAN__=true` 才生效，但 SDK 本体一直在 bundle 中
- **修法**：

  ```ts
  if (isScanEnabled) {
    const { scan } = await import('react-scan');
    scan({ enabled: isDev });
  }
  ```

- **收益**：主 bundle 减 ~10-20 KB gzip

### P0-8 build 串行 `tsc + vite`

- **位置**：`apps/web/package.json:8`
- **现状**：`"build": "tsc -p tsconfig.app.json --noEmit && vite build"`
- **问题**：CI 时间翻倍；typecheck 与构建失败信号混合，排查时不直观
- **修法**：CI 拆步骤（typecheck job + build job 并行）；本地保持现状以拿到一次性失败信号

### P0-9 `<Suspense fallback={null}>` + Map.tsx 内部未做二级分割

- **位置**：`apps/web/src/App.tsx:25` `<Suspense fallback={null}>`
- **现状**：LoadingScreen 由 `loadingManager` 控制并行渲染；Map.tsx 内部仍可能同步 import 大量子组件
- **修法**：
  - 对 Map 中的右键菜单、preset_store、collections、dev_tools 等做 `React.lazy`
  - 把 Suspense fallback 接入 LoadingScreen 的子阶段（如 LoadingStageId.COMPONENTS）
- **收益**：首次有内容渲染时间（FMP）下降

---

## 2. 潜在 Bug（按严重度）

### BUG-1 🔴 PWA Manifest 512 图标文件名 typo

- **位置**：`apps/web/vite.config.ts:85` `src: 'ndroid-chrome-512x512.png'`
- **证据**：`apps/web/public/` 实际文件名是 `android-chrome-512x512.png`
- **后果**：PWA 安装后 512 图标 404；iOS A2HS / Android 桌面图标 / 启动屏图标会 fallback 到 192 或浏览器默认
- **修法**：1 字符修复 `'android-chrome-512x512.png'`

### BUG-2 🔴 SW 更新提示用 native `alert()` 阻塞

- **位置**：`apps/web/src/main.tsx:49` `alert(message);`
- **后果**：
  1. iOS Safari 下 native alert 会暂停 SW 注册流程
  2. 项目自家有 `ZmdAlert` / `ZmdAlertFull` 自定义组件不复用
  3. 不可定制（按钮文案、倒计时刷新）
- **修法**：用 `ZmdAlert.confirm({ title, content, onConfirm: () => updateServiceWorker(true) })`

### BUG-3 SW prompt 语种与 i18n 实际语种不一致

- **位置**：`apps/web/src/main.tsx:38` 用 `navigator.language.toLowerCase()`
- **对比**：`packages/map-service/src/service/i18n.ts:30` `fallbackLng = 'zh-CN'`，用户语种由 `i18next-browser-languagedetector` 决定（可能读 localStorage）
- **后果**：英文浏览器 + 用户手动切中文 → UI 中文、SW 提示英文
- **修法**：等 i18n 初始化后复用 `i18nService.currentLocale`，提示文案改用 `t('common:sw_update_available')`

### BUG-4 🟠 `ServerService.apiRequest` 拿到新 token 后的 retry 没传 `isRetryAfterRefresh`

- **位置**：`packages/map-service/src/service/server.ts:297-326`
- **现状**：`apiRequest` 走 `waitForTokenRefresh()` 拿到 `newToken` 后，line 314 调用 `this.request<...>(fullApiUrl, options)` —— **未传第三参数 `true`**
- **对比**：`unauthorizedHandler` 内的两处 retry（line 168 / 214）都传了 `true`
- **后果**：极端时序下，apiRequest 拿到新 token、发起 request，恰好该 token 又被服务端撤销（如管理员强踢）→ 401 → 进 `unauthorizedHandler` 再次 refresh，可能多发 1-2 次无效 refresh 请求（直到 refresh 本身也 401 触发 logout）
- **修法**：line 314 改为 `await this.request<ServerResponse<T>>(fullApiUrl, options, true)`

### BUG-5 🟠 alert 体系存在两套并行实现，命名分歧无文档

- **位置**：`apps/web/src/components/common/alert/` 下 4 文件
  - `alert.tsx` `ZmdAlert` 组件（observer + mobx-react-lite + createPortal）
  - `alert_api.tsx` imperative API（含 prompt 输入，且 import 了 `@/components/common/input`）
  - `alert_full.tsx` `ZmdAlertFull` 组件
  - `alert_full_api.tsx` imperative API
- **问题**：
  1. 谁该用 Full / 普通版没有书面规则
  2. `alert_api.tsx` 跟 input 组件强耦合
  3. 多入口可能导致 ZmdAlert / ZmdAlertFull 弹层堆叠焦点冲突
- **修法**：归一化 `alert.confirm / alert.prompt / alert.fullscreen` 三个 API 到 `alert_api`，组件仍保留两套

### BUG-6 🟠 react-compiler 1.0 + MobX 兼容性未验证

- **位置**：`apps/web/vite.config.ts:48` `['babel-plugin-react-compiler']`
- **风险**：
  - react-compiler 自动 memo 假设组件函数纯且 dependency 可静态推断
  - MobX `observer()` 通过 Proxy 拦截 observable 读取，read 顺序 / 条件可能被 compiler 错误优化
  - react-compiler 1.x 的 MobX 兼容性社区仍有 issue
- **验证步骤**：
  1. 启 dev server，找 `observer` 组件做 observable 更新，看是否正常 re-render
  2. vite plugin 配置加 `compilerOptions: { panicThreshold: 'all_errors' }`，跑一次完整 build 看 panic 数量
- **缓解**：受影响组件加 `'use no memo'` 指令，或配置 compiler 跳过 observer 包裹组件

### BUG-7 🟡 locale resourceLoader 用 4 级相对路径写死

- **位置**：`apps/web/src/services/index.ts:13`
- **现状**：

  ```ts
  const localeModules = import.meta.glob<{ default: Record<string, unknown> }>(
    '../../../../packages/map-service/src/locales/**/*.json'
  );
  ```

- **后果**：apps/web 或 packages 任一目录被重构，glob 静默 miss → 所有翻译 reject、afterLoad 永不触发、LoadingStageId.I18N 卡在中间
- **修法**：用 `@endfieldmap/map-service` 的导出 + alias；或迁到 `packages/map-service/src/locales/index.ts` 里持有 glob，apps/web 直接 import

### BUG-8 🟡 dev alias 漏 maplibre / storage-mmkv / storage-expo-sqlite

- **位置**：`apps/web/vite.config.ts:27-34`
- **状态**：apps/web 当前只用 OL + storage-web，**符合现状**
- **后果**：在 dev 模式下改这些被漏 alias 的包不会 HMR，需要 build 该包后才能看到效果
- **修法**：可选补 alias；line 101 已 dev-only 隔离，不影响生产

### BUG-9 🟡 LoadingScreen 进度回退（历史已修复，仅覆盖 i18n）

- **位置**：`apps/web/src/services/index.ts:31-37`
- **现状**：`initialLoadComplete` 标记 + 注释 "防止语言切换导致进度回退" —— 修复**仅针对 I18N stage**
- **风险**：COMPONENTS / DATA 等 stage 如果将来出现切换 / 重试场景，可能再次出现进度回退
- **建议**：把"只增不减"保护下沉到 `loadingManager.updateStageProgress` 内部

### BUG-10 🟡 `__COMMIT_HASH__` 本地 fallback 为空字符串

- **位置**：`apps/web/vite.config.ts:40` `process.env.CNB_BUILD_ID || process.env.GITHUB_SHA || ''`
- **后果**：本地 build / preview 时 `__COMMIT_HASH__ = ''`，Sentry event 的 `versionInfo.commitHash`（`apps/web/src/services/logger.ts:30`）为空 → issue 无法关联到具体 commit
- **修法**：fallback 改 `child_process.execSync('git rev-parse --short HEAD').toString().trim()`，或 `'dev-' + Date.now()`

### BUG-11 🟡 PWA workbox.sourcemap 与 Sentry hidden sourcemap 协同（追踪项）

- **位置**：`apps/web/vite.config.ts:69`（workbox `sourcemap: false`）+ `vite.config.ts:111`（`sourcemap: sentryEnabled ? 'hidden' : false`） + `vite.config.ts:92-97`（自定义 `cleanup-residual-sourcemaps` plugin）
- **现状**：链路是好的，但叠加 3 个机制（workbox 不索引 / vite hidden / 后清理）值得监控
- **建议**：CI build 后断言 `dist/` 内无 `*.map` 残留

### BUG-12 🟡 `setUid` 用 falsy 判空

- **位置**：`packages/map-service/src/service/server.ts:52-54` `this.uid = uid || null`
- **风险**：若后端将来允许数字 0 作为合法 uid，会被改成 null。当前应无影响，留作追踪
- **修法**：改 `this.uid = uid ?? null`

### BUG-13 🟢 主题切换 / 暗黑模式机制存疑

- **位置**：`apps/web/src/index.css:5` `@custom-variant dark (&:where(.dark, .dark *))`
- **现状**：单 endfield 主题，grep 未发现 `<html class="dark">` 切换代码 → dark 变体当前**实际未启用**
- **风险**：Tailwind v4 仍会生成 `.dark` 变体 CSS（即便没用），增加 CSS 体积；且未来想接暗黑会有 selector 已发布的兼容包袱
- **建议**：明确路线—若废弃则移除 `@custom-variant`；若启用则补主题切换 store

### BUG-14 🟢 ESLint config 对 apps vs packages 无差异化

- **位置**：根 `eslint.config.js`
- **现状**：单组规则匹配所有 `**/*.{ts,tsx}`；packages 内可以无报错地使用 `window` / DOM API
- **影响**：跨平台 packages（map-core / map-service / map-hooks）写了 DOM 调用不会被 lint 拦下
- **建议**：用 file-scoped overrides 区分 web-only 与 cross-platform 包

---

## 3. 优先级 → 落地建议

按 **影响 / 工作量** 排序：

| # | 改动 | 文件 | 行数 | 工作量 | 收益 |
|---|---|---|---|---|---|
| 1 | 修 Manifest 512 typo | `apps/web/vite.config.ts:85` | 1 | 1 分钟 | 修 PWA 大图标 404 |
| 2 | 删 `appType: 'mpa'` | `apps/web/vite.config.ts:43` | 1 | 1 分钟 | SPA 行为正常 |
| 3 | PWA `includeAssets` 删 `images/**` | `apps/web/vite.config.ts:72` | 1 | 5 分钟（需配 runtimeCaching） | 首次 SW 安装 17 MB → ~1 MB |
| 4 | `apiRequest` retry 传 `true` | `packages/map-service/src/service/server.ts:314` | 1 | 1 分钟 | 修 401 边角递归 |
| 5 | `react-scan` 改 dynamic import | `apps/web/src/main.tsx:9,17-21` | ~5 | 5 分钟 | 主 bundle 减 ~15 KB gzip |
| 6 | Sentry 改 dynamic import | `apps/web/src/services/logger.ts` | ~15 | 15 分钟 | 主 bundle 减 ~80 KB gzip |
| 7 | Lightbox 改 `React.lazy` | `apps/web/src/components/common/guide/index.tsx` | ~10 | 15 分钟 | 主 bundle 减 ~30-50 KB gzip |
| 8 | SW 提示改 ZmdAlert + 复用 i18n | `apps/web/src/main.tsx:23-54` | ~20 | 30 分钟 | UX 一致 |
| 9 | Google Fonts 自托管子集 + preload | `apps/web/src/index.css:1` + `apps/web/index.html` | 2 文件 | 1-2 小时 | LCP -200~1000 ms |
| 10 | i18n manualChunks 按 locale 切分 | `apps/web/vite.config.ts:114-160` + `services/index.ts:13` | ~30 | 1-2 小时 | 用户实际加载 i18n 减 80% |
| 11 | `Map.tsx` 内部二级 `React.lazy` | `apps/web/src/Map.tsx` 及其子树 | 视范围 | 半天起 | FMP 进一步降 |
| 12 | react-compiler + MobX 验证 | 全局 | 测试为主 | 半天起 | 排除潜在响应性 bug |

**推荐 PR 拆法**：

- PR-A「单行 fix」：#1 + #2 + #4（manifest typo / appType / apiRequest 标记）
- PR-B「主 bundle 瘦身」：#3 + #5 + #6 + #7（precache 瘦身 + 三处异步 import）
- PR-C「字体重做」：#9
- PR-D「i18n 分包」：#10
- PR-E「UX」：#8（SW 提示）
- PR-F「分割 Map」：#11 + #12（性能 + 兼容性双测）

---

## 4. 验证手段

每条改动都至少要通过以下 2 项：

1. **build**：`pnpm --filter ./apps/web build` 全过
2. **build size diff**：build 前后对比 `dist/assets/*.js`（特别是 `react-vendor`、entry chunk、`sentry-vendor`、`lightbox-vendor`、`lang-*` 的体积）
3. **manual**：dev server 起来后，至少在 PC + iPhone SE 375 / iPhone 14 Pro 393 / iPad 768 三个采样下点开标点弹窗、切语言、登出登录走通

涉及 Sentry / PWA 的改动还要：

4. 在带 `SENTRY_AUTH_TOKEN/ORG/PROJECT` 的环境下 build 一次，确认 sourcemap 上传 + `.map` 清理无遗留
5. 用真机 / Chrome 模拟 PWA 安装，确认 manifest / icons / SW 都生效

---

## 5. 执行追踪（branch `perf/audit-followups`）

### 已完成

| # | 项 | 状态 | Commit | 实测结果 |
|---|---|---|---|---|
| 1 | BUG-1 Manifest 512 typo | ✅ Done | `9d49867` | 字符纠正，PWA 大图标可正常加载 |
| 2 | P0-6 删 `appType:'mpa'` | ✅ Done | `2c86b85` | SPA 行为恢复默认 |
| 3 | P0-2 PWA `includeAssets` 删 images | ⚠️ Partial | `5fe7924` | 仅省 ~1.5 MB（事实表明 lang chunks 才是大头，非 images）|
| 4 | BUG-4 apiRequest 标 `isRetryAfterRefresh` | ✅ Done | `cf072dc` | 401 边角不再多发 refresh |
| 5 | P0-7 react-scan 异步 | ✅ Done | `fe8c652` | 静态 import 删除 |
| 6 | P0-4 Sentry 异步 | ✅ Done | `b7a088f` + `b769115` | **react-vendor 754 KB → 528 KB（-226 KB）**；sentry-vendor 独立 209 KB chunk；顺手清理三处重复 `logger.addReporter` |
| 7 | P0-5 Lightbox `React.lazy` | ✅ Done | `0f09d64` | lightbox-vendor 52 KB 独立 chunk + lightbox.css 拆出；首次点击图片才加载 |
| 8 | BUG-2/3 SW 提示 | ✅ Done | `6fe1abd` | 改用 `alert.info` + `useTranslation`；新增 `common:sw_update_available` 文案（zh-CN/en-US）；alert_api 走 dynamic import 保持 entry 6.8 KB |
| 9 | P0-1 字体加载 | ✅ Done | `9c35466` | `@import url` 删除（不再渲染阻塞）；改 HTML `<link>` + preconnect；字重清单 30 → 14（删 Roboto + Noto/Outfit 精简）|
| 10 | P0-3 i18n manualChunks 按 locale | ⚠️ Partial | `1b64d6c` | chunk 命名稳定（`lang-zh-CN-*.js` 等），单 locale 改动只影响自身 hash；**precache 体积未减少**（仍 17.6 MB），见下方"待决策" |

### 配套修复

| Commit | 内容 |
|---|---|
| `b769115` | manualChunks 中 `@sentry/` 规则前置（pre-existing bug：原顺序导致 `@sentry/react` 匹配 `/react/` 落到 react-vendor） |
| `3d3104d` | 触及文件的 `simple-import-sort` autofix 收尾 |

### 关键量化

| 指标 | Before | After |
|---|---|---|
| react-vendor | 754 KB | 528 KB（-226 KB / -30%）|
| sentry-vendor | 不存在（混在 react-vendor） | 独立 209 KB（lazy） |
| lightbox-vendor | 同步加载链 | 52 KB 独立 lazy chunk |
| entry chunk (`index-*.js`) | ~481 KB（旧基线） | ~6.8 KB |
| 字体请求权重总数 | 30 | 14 |
| CSS @import 渲染阻塞 | 是 | 否 |
| PWA precache | 153 entries / 17606 KiB | 97 entries / 17647 KiB（条目 -56，体积几乎不变） |

### 偏差与发现

1. **PERF-AUDIT 对 P0-2 的判断事实有误**：原文写"precache 17 MB 大部分是 images/\*\*"。实测 `public/images` 仅 1.5 MB / 18 文件，`dist/assets/lang-*.js` 共 14 MB 才是大头。P0-2 修复仍有语义正确性（PWA 不该精确预缓存图片），但体积收益远低于预期。
2. **pre-existing manualChunks 顺序 bug**：`/react/` 规则匹配 `@sentry/react/`，导致 Sentry 一直被错误归入 react-vendor。配合 P0-4 暴露后修复，是本轮第二大单项收益。
3. **logger.addReporter 三重注册**：`logger.ts` + `MapService` + `EndfieldMapAdapter` 各自 addReporter 同一个 sentryReporter，Sentry 事件会被发送 2-3 次。重构 P0-4 时一并清理。

### 待决策 / 未执行

| # | 项 | 阻塞原因 |
|---|---|---|
| 11 | PWA precache 真正瘦身（仅 precache fallback locale 的 lang chunk） | 离线 UX trade-off：用户切换到未缓存的语言会断；需产品决策 |
| 12 | P0-8 build 串行 `tsc + vite` 拆并行 | CI pipeline 层面，不影响本地 build |
| 13 | P0-9 `Map.tsx` 内部二级 `React.lazy` | 开放性 UI 重构，需先列子树清单 |
| 14 | BUG-5 alert 体系归一（alert / alert_full / alert_api / alert_full_api 4 文件） | 影响面大，需架构决策选哪套留 |
| 15 | BUG-6 react-compiler + MobX observer 兼容性验证 | 需要真实浏览器环境 + observer 组件用例 |
| 16 | 字体进一步自托管子集化 | 需下载字体源、做 zh-Hans subset，本次仅做"轻量优化" |

---

## 相关文档

- [CLAUDE.md](../CLAUDE.md) — 仓库总览与架构
- [docs/DATA-FLOW.md](./DATA-FLOW.md) — 数据流转规范（ServerService 详细行为在这里）
- [docs/UI-GUIDELINES.md](./UI-GUIDELINES.md) — UI 规范
- [docs/INTERACTION.md](./INTERACTION.md) — 交互规范（ZmdAlert / LoadingScreen 在这里）
- [docs/I18N.md](./I18N.md) — 国际化规范
