# 数据流转规范（Data Flow）

## 1. 本文档目的与适用范围

本文档约束 EndfieldMap 从 UI 组件到后端 / 本地存储 / 同步 引擎的"数据传递路径"，目标是：

- 明确"哪个 service 写在 `apps/web/src/services/` vs `packages/map-service/src/service/`"的判断准则；
- 统一后端请求经过 `ServerService`，复用 token、Lang header 与 401 refresh 队列；
- 规范错误约定（成功返回业务对象，失败返回 `{error:{code,message,details}}`，由 `ApiError` 保留状态码和错误码）；
- 给出 MobX store 与 React 的绑定方式、RxDB 集合定义与同步、跨平台存储 (`IStorageAdapter`) 的使用规范。

适用于 `apps/web/src/services/**`、`packages/map-service/src/**`、`packages/storage-*/**` 及任何会产生网络 / 数据库 / 持久化副作用的代码。

---

## 2. 三层结构示意图

```
┌──────────────────────────────────────────────────────────────────────┐
│  UI 层  apps/web/src/components/**  apps/web/src/examples/**         │
│   - observer / useMobxSource 订阅 store                              │
│   - 用 useTranslation, hooks (map-hooks) 等                          │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ 调用
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Web 业务 service 层  apps/web/src/services/**                       │
│   - UI 副作用 / 浏览器专属：UIManager / LoadingManager / cursor       │
│   - 入口聚合：services/index.ts 构造跨平台 MapService 单例           │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ 调用
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  跨平台 service 层  packages/map-service/src/service/**              │
│   - MapService (聚合 i18n / asset / server / preset / database)      │
│   - ServerService / I18nService / AssetService / PresetService ...   │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ 调用
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  网络 / 数据库 / 存储                                                │
│   - ServerService.apiXxx → fetch /api/v1/**                          │
│   - RxDB(Dexie) collections + syncPull/syncPush                      │
│   - IStorageAdapter (localStorage / MMKV / Expo SQLite)              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. service 边界：放在哪一层？

| 特征 | 放 `apps/web/src/services/` | 放 `packages/map-service/src/service/` |
| --- | --- | --- |
| 依赖浏览器 API（`window` / `document` / `MutationObserver` / `matchMedia`） | ✅ | ❌ |
| 依赖 web-only 第三方（OpenLayers、GSAP、portal） | ✅ | ❌ |
| 纯领域 / 业务逻辑（数据获取、用户数据、preset） | ❌ | ✅ |
| 需要被 `apps/native`（Expo / RN）复用 | ❌ | ✅ |
| 与 UIManager / LoadingManager 直接交互的副作用 | ✅ | ❌ |
| 单元测试不需要 jsdom 即可跑 | 优先 | ✅ |

判断口诀："**能在 Node 里跑的、跨端需要的 → packages；非 Node 跑、依赖 DOM/UI 状态的 → apps/web/src/services**"。

实例：

- `UIManager`、`LoadingManager`、`cursor`、`context_menu` → `apps/web/src/services/`（依赖 DOM）；
- `ServerService`、`I18nService`、`AssetService`、`PresetService`、`UserDataService` → `packages/map-service/src/service/`（跨平台）。

---

## 4. ServerService 使用

本站后端请求必须经过 `packages/map-service/src/service/server.ts` 的 `ServerService`。它使用原生 fetch，接口前缀 `/api/v1`，自动注入 `Authorization` / `Lang`。角色在对应接口的 `role_id` 或 `roleId` 参数中传递，不再发送 `Uid` header。AI 供应商请求由 `AiClient` 独立处理，避免向第三方发送本站 token 和 cookie。

### 4.1 方法表

| 方法 | 用途 |
| --- | --- |
| `apiGet(path, params?)` | `/api/v1` + 自动加 header / token |
| `apiPost(path, body?)` | 同上 |
| `apiPut(path, body?)` | 同上 |
| `apiDelete(path, params?)` | 同上 |
| `apiRequest(options)` | 上述 4 个方法内部统一走的封装；自定义需求（非 JSON、自定义 header）调用此入口 |
| `request(url, init)` | 最底层 fetch 包装，**不加前缀、不加 token**；仅用于完全外部资源（CDN、第三方公开 API） |
| `syncPull(collection, checkpoint, limit)` | RxDB 拉取 `/api/v1/sync/<collection>/pull` |
| `syncPush(collection, rows)` | RxDB 推送 `/api/v1/sync/<collection>/push` |

### 4.2 典型调用

✅ 推荐：

```ts
const result = await server.apiGet<UserProfile>('/user/profile');
const created = await server.apiPost<Marked>('/marked', { x, y, note });
```

❌ 反例：

```ts
// 直接 fetch，绕开 token / Lang header / 401 处理
const res = await fetch('/api/v1/user/profile', { headers: { Authorization: '...' } });
```

```ts
// 用 axios 自建 client：项目无 axios 依赖，且分裂了 401 refresh 队列
import axios from 'axios';
```

### 4.3 自动注入的 header

| Header | 来源 |
| --- | --- |
| `Authorization: Bearer <token>` | `ServerService` 内部 token 状态 |
| `Lang` | `i18nService.currentLocale` |

后端拿到 `Lang` 用于返回该语种的错误文案 / 数据—— 因此**不要**在业务调用方再次手动加 `Lang` header。

---

## 5. 401 / token refresh 队列

`ServerService` 在 `apiRequest` 内挂了 `unauthorizedHandler`，遇 401 自动走 refresh 流程：

```
请求 A → 401
        ├─ isRefreshing? 否：置 true，开始 refresh
        │     ↓ 同时来的请求 B/C/D → push 进 requestsQueue 等待
        │     ↓ refresh 成功：flush 队列，挨个 retry (isRetryAfterRefresh: true)
        │     ↓ refresh 返回 401：触发登出；网络故障、超时或 5xx：保留会话并拒绝等待请求
        └─ isRefreshing? 是：当前请求也入队
```

关键变量：

- `isRefreshing` —— 防止并发触发多次 refresh；
- `requestsQueue` —— 等待 refresh 完成后批量 retry 的请求；
- `isLoggingOut` —— 登出过程中再次触发 refresh 时直接放弃，防止重入；
- `isRetryAfterRefresh: true` —— retry 时携带的标志位，**再次** 401 不会重新入队，直接 throw，避免死循环。

### 5.1 规范

- **任何新接口都必须走 `apiRequest`（或其封装 apiGet/Post/Put/Delete）**，不可绕过；
- 业务代码**不要捕获 401**，让 `unauthorizedHandler` 处理；
- 仅当你正在实现 token 体系本身（refresh 端点、登出端点）才直接调底层 `request`，并显式 `isRetryAfterRefresh: true` 防止递归刷新。

---

## 6. 错误约定

### 6.1 响应包结构

```jsonc
// 成功：直接返回业务对象
{ "id": 1, "username": "alice", "nickname": "Alice" }

// 失败：真实的 4xx / 5xx 状态码与错误体
{ "error": { "code": "INVALID_CREDENTIALS", "message": "invalid credentials" } }
```

成功响应无需拆 `data`。失败响应转为 `ApiError`，保留 `status`、`code` 和 `message`；调用方不读取原始 Response。登录凭据错误直接返回，不刷新已有会话。

### 6.2 错误码

错误码以 DijiangV2 `internal/httpx/codes.go` 为准，例如 `GUIDE_ALREADY_EXISTS`、`RATE_LIMITED` 和 `RECENT_LOGIN_REQUIRED`。不再使用旧版数字分段。面向用户的本地化文案放在 `error` namespace。

### 6.3 UI 侧消费

普通错误展示 `err.message`；需要区分处理时先确认 `err instanceof ApiError`，再判断字符串 `err.code`。领域服务可转为自己的错误类型，例如 `GuideApiError`。

---

## 7. MobX store 与 React 绑定

### 7.1 状态管理基础

- MobX 6 + class decorators；
- Babel：`@babel/plugin-proposal-decorators` `version: '2023-11'` + `class-properties loose:true` + `class-static-block`；
- 严禁在 React 组件里直接 `new SomeStore()` —— store 必须是 service 单例的成员（`services/index.ts` 构造）。

### 7.2 在 React 里订阅

| 工具 | 用法 |
| --- | --- |
| `observer()`（`mobx-react-lite`） | 普通函数组件包裹，自动响应组件用到的 observable |
| `useMobxSource(getter)`（`map-hooks`） | 把 store 字段映射为 React state，常用于需要 select / derived 的场景 |
| `reaction(() => fn, effect)` | 副作用：跨 store 联动、订阅外部资源——**写在 store / service 内部**，不写在组件里 |

✅ 推荐：

```tsx
export const UserAvatar = observer(() => {
  const { user } = mapService;
  return <img src={user.avatar} alt={user.name} />;
});
```

```tsx
const isLoggedIn = useMobxSource(() => mapService.user.isLoggedIn);
```

❌ 反例：

```tsx
// 在组件里写 reaction，组件卸载未 dispose → 内存泄漏
useEffect(() => {
  reaction(() => store.x, (x) => console.log(x));
}, []);
```

### 7.3 写流程

- store 方法上加 `@action`（class decorator）或 `runInAction` 包裹异步赋值；
- 异步：`async` 方法第一段 `@action` 不能贯穿 await，await 后的 setter 用 `runInAction`。

---

## 8. RxDB 集合与同步

### 8.1 storage

- 浏览器端：`rxdb/plugins/storage-dexie`（IndexedDB 适配器）；
- 注入位置：`apps/web/src/services/index.ts` 把 dexie storage 写入 `MapService.databaseConfig.storage`；
- 集合定义：`packages/map-service/src/service/user/data/<feature>/entity.ts`，目前包含 `visibility/entity.ts`、`marked/entity.ts` 等。

### 8.2 React 绑定

`@tanstack/react-db` + `@tanstack/rxdb-db-collection` 把 RxDB collection 适配为 react-db collection，组件用 react-db 的 hooks 订阅。

### 8.3 同步

- 端点：`/api/v1/sync/<collection>/pull` 与 `/api/v1/sync/<collection>/push`；
- 入口：`ServerService.syncPull` / `syncPush`；
- Checkpoint：`updated_at` + `id`，**字段名 snake_case**（后端协议）；
- 多端同步要带 `role_id`（标识当前角色 / 存档），缺失会被后端拒绝。

### 8.4 字段命名规范

- 数据库 schema / 同步协议字段：`snake_case`（与后端对齐）；
- TS 侧 entity / Service 公开类型：`camelCase`；
- 在 collection 的 `migrationStrategies` 或 transform 函数里做转换，不要让两套命名渗透到上层。

---

## 9. 跨平台存储（IStorageAdapter）

平台无关存储抽象：`@endfieldmap/tools` 暴露 `IStorageAdapter` 接口；三套实现：

| 实现 | 平台 | 备注 |
| --- | --- | --- |
| `storage-web` | Web | localStorage，key prefix `endfieldmap.` |
| `storage-mmkv` | React Native | MMKV |
| `storage-expo-sqlite` | Expo | SQLite |

### 9.1 规范

- **`packages/**` 内禁止直接访问 `localStorage` / `AsyncStorage`**——必须通过 `IStorageAdapter`；
- `apps/web` 应用层可以直接用 localStorage 处理"仅 web 有意义"的状态（例如 UI 折叠状态），但跨平台共享数据必须走 adapter；
- adapter 由 `apps/web/src/services/index.ts` 注入到 `MapService` 构造参数。

✅ 推荐：

```ts
// 在 packages/map-service 内
this.storage.setItem('lang', 'zh-CN');
const lang = await this.storage.getItem('lang');
```

❌ 反例：

```ts
// packages/map-service/...
localStorage.setItem('lang', 'zh-CN'); // RN 端崩溃
```

---

## 10. 反例集

| 反例 | 问题 | 推荐 |
| --- | --- | --- |
| 业务代码直接 `fetch(...)` 后端接口 | 绕过 token / Lang / 401 队列 | `server.apiGet` 等 |
| 引入 axios | 项目无 axios 依赖，分裂请求层 | 用 `ServerService` |
| UI 组件捕获 401 自己跳登录 | 与 `unauthorizedHandler` 双重处理 | 让 `ServerService` 处理 |
| 在 React 组件内 `reaction(...)` 不 dispose | 内存泄漏 | 写在 store/service，或用 `useMobxSource` |
| `packages/...` 直接 `localStorage` | RN 端崩 | 用 `IStorageAdapter` |
| 在 `apps/web/src/services/` 写纯数据 service | 失去跨端复用 | 迁到 `packages/map-service/src/service/` |
| 同步 checkpoint 用 `updatedAt`（camelCase）传后端 | 字段不匹配 | 用 snake_case `updated_at` |
| 业务异步用 setter 不 `runInAction` 包裹 | MobX 严格模式下警告 / 失效 | `runInAction(() => { this.x = ... })` |
| 同接口新建独立 fetch helper 而不复用 ServerService | 401 / refresh 不一致 | 用 `apiRequest` |
| 错误文案硬编码英文 | 多语言断裂 | i18n `error` ns + `defaultValue` 中文兜底 |
| `new SomeStore()` 在组件内 | 每次 mount 重置状态 | service 单例持有 |

---

## 相关文档

- UI 规范：`docs/UI-GUIDELINES.md`
- 交互规范：`docs/INTERACTION.md`
- 国际化规范：`docs/I18N.md`
- 项目说明：`CLAUDE.md`
