# 交互规范（Interaction）

## 1. 本文档目的与适用范围

本文档定义 EndfieldMap web 端的"用户可感知的交互反馈"层规范，包括：

- 反馈层级（Alert / AlertFull / LoadingScreen）的职责分工与调用方式；
- 加载态（全局 LoadingManager 阶段、Suspense fallback、按钮 loading）的取舍；
- 错误展示（业务错误 vs 网络错误）链路；
- 浮层 / Modal 的实现规范、portal 注意点、关闭策略；
- 键盘 / 快捷键、移动端手势的当前能力边界。

适用于 `apps/web/src/**` 与所有以 `apps/web` 为消费方的 `packages/**` 副作用 API。本文档与 `docs/UI-GUIDELINES.md` 互为补充：UI 规范管"长什么样"，本规范管"用户做什么、系统怎么反馈"。

---

## 2. 反馈层级

项目**不使用 Toast / Snackbar**。所有可感知反馈集中在 3 类组件，按"轻 → 重"：

| 层级 | 组件 | 文件 | 适用场景 |
| --- | --- | --- | --- |
| 轻量临时 | `ZmdAlert` | `apps/web/src/components/common/alert/alert.tsx`、`alert_api.tsx` | 普通成功 / 失败提示、confirm 二次确认、prompt 输入 |
| 重型 / 中断 | `ZmdAlertFull` | `apps/web/src/components/common/alert/alert_full.tsx`、`alert_full_api.tsx` | 阻塞性公告、长文本协议、不可关闭警告 |
| 启动 / 大任务 | `LoadingScreen` | `apps/web/src/components/common/loading_screen.tsx`（受 `services/loading/LoadingManager` 驱动） | 应用启动多阶段进度、大数据预加载 |

### 2.1 ZmdAlert

`ZmdAlert` 是 observer 组件（`mobx-react-lite`）+ `createPortal`。命令式 API 在 `alert_api.tsx` 暴露，支持 confirm / prompt 输入。

✅ 推荐：

```tsx
import { showAlert, showConfirm, showPrompt } from '@/components/common/alert/alert_api';

await showAlert({ title: t('common:tips'), content: t('common:saved') });

const ok = await showConfirm({ title: t('common:confirm_delete') });
if (ok) await api.delete();

const name = await showPrompt({ title: t('common:rename'), defaultValue: oldName });
```

❌ 反例：

```ts
// 绕开统一反馈，浏览器 alert 在移动端有原生兼容问题，也不可主题化
alert('保存成功');
window.confirm('确定删除?');
```

### 2.2 ZmdAlertFull

`ZmdAlertFull` 用于需要占满视口、阻塞用户继续操作的场景（条款协议、严重错误、需要滚动阅读的公告）。命令式 API 见 `alert_full_api.tsx`。

判定准则：

- 文案 < 3 行、用户瞄一眼即可关闭 → `ZmdAlert`；
- 文案 > 3 行，或包含富文本 / 长协议，或需用户滚到底部才能确认 → `ZmdAlertFull`。

### 2.3 LoadingScreen

由 `LoadingManager` 驱动多阶段：典型阶段包括 `COMPONENTS` / `DATA` / `I18N` 等。应用启动、版本升级、首次同步等"全局阻塞型"任务统一接入：

```ts
import { LoadingManager } from '@/services';

LoadingManager.beginStage('DATA');
await mapService.databaseConfig.warmup();
LoadingManager.endStage('DATA');
```

不要为页面内的局部 loading 接入 LoadingManager —— 那是 Suspense / 按钮 loading 的职责（见第 3 节）。

---

## 3. 加载态

### 3.1 三档加载

| 档位 | 用法 | 典型场景 |
| --- | --- | --- |
| 全局 LoadingScreen | `LoadingManager` 多阶段 | 启动 / 大型迁移 |
| 路由 / 组件级 Suspense | `<Suspense fallback={<LogoLoading />} />` | 懒加载页面、Heavy 子树 |
| 控件级 | `<Button loading />` / inline spinner | 表单提交、单条数据刷新 |

### 3.2 控件级 loading

`packages/web-components` 的 `Button` 自带 loading 状态，提交类操作必须用它：

✅ 推荐：

```tsx
const [submitting, setSubmitting] = useState(false);
const onSubmit = async () => {
  setSubmitting(true);
  try { await save(); } finally { setSubmitting(false); }
};
return <Button loading={submitting} onClick={onSubmit}>保存</Button>;
```

❌ 反例：

```tsx
// 没有 loading 反馈，用户连点 → 重复请求
<button onClick={onSubmit}>保存</button>
```

### 3.3 Suspense fallback

懒加载组件统一 fallback 用 `web-components/logo_loading` 的 `LogoLoading`，保持视觉一致：

```tsx
<Suspense fallback={<LogoLoading />}>
  <LazyMapPanel />
</Suspense>
```

不要在 fallback 里写"加载中..."纯文本——视觉一致性差，也丢失了 logo 等品牌信号。

---

## 4. 错误展示

### 4.1 错误来源与统一链路

应用错误统一收敛到 `Error` 对象，再由 UI 层选择呈现方式。

| 来源 | 处理方式 |
| --- | --- |
| 业务错误（后端返回 `code !== 0`） | `ServerService.apiRequest` 内部 `throw new Error(data.message ?? i18n('error:unknown'))` |
| 网络错误（fetch 抛出 / 4xx 5xx） | `ServerService` 同样 throw 标准化 Error |
| 客户端逻辑错误（参数校验、状态非法） | 调用方自行 `throw new Error(i18n('error:xxx'))` |
| 401 未授权 | `unauthorizedHandler` 自动 refresh + retry，**不要在业务层捕获** |

### 4.2 UI 呈现

```tsx
try {
  await api.save(payload);
  showAlert({ title: t('common:saved') });
} catch (err) {
  showAlert({
    title: t('common:save_failed'),
    content: err instanceof Error ? err.message : t('error:unknown'),
  });
}
```

- 短文案 → `ZmdAlert`；
- 长文本 / 列表错误 → `ZmdAlertFull`；
- 表单字段级错误 → 字段下方 inline 提示，**不要**弹 Alert。

### 4.3 错误文案的 i18n

错误文案必须来自 i18n（`namespace: 'error'`），并带中文兜底，详见 `docs/I18N.md`：

```ts
i18nService.translate('save_failed', { ns: 'error', defaultValue: '保存失败' });
```

✅ 推荐：业务错误 throw 后由 UI 拼装文案。

❌ 反例：业务层直接调 `showAlert`、把 service 强耦合到 UI，service 失去可测试性。

---

## 5. 浮层 / Modal

### 5.1 实现优先级

1. **原生 `<dialog>` + `AnimatePresence`** —— web-components 的 `Dialog` 即此实现，**默认选择**；
2. **`createPortal` + 自定义层** —— 当 `<dialog>` 不能满足（如需嵌套打开多个、需要自定义半透明蒙层动画）；
3. **完全自管层级** —— 仅最复杂的 BubbleMenu / Tooltip 场景，必须给出 z-index 注释。

### 5.2 portal 注意点

- 任何使用 `createPortal` 的浮层默认挂到 `document.body`，**会跳出父级 `backdrop-filter` 包含块**——移动端尤其要在两种父级状态下都验证模糊是否还在；
- 浮层内部如果有 `sticky` 子元素，须自行处理 safe-area inset；
- 在 `deviceJudge` 包裹下，PC / Mobile 两份浮层实现要独立验证开关动画（移动端常做 Drawer 上滑、PC 做居中淡入）。

### 5.3 关闭策略

| 触发 | 默认行为 |
| --- | --- |
| ESC 键 | 关闭（除非 `dismissible: false`） |
| 点击外部 / 蒙层 | 关闭（除非 `dismissible: false`） |
| 移动端硬件返回（浏览器 history.back） | 关闭顶层浮层后再返回上层路由 |

`dismissible: false` 仅用于"必须等用户做选择"的 confirm / 协议同意场景。任何长时间不可关闭的 Modal 都属于反例。

✅ 推荐：

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogTitle>{t('common:settings')}</DialogTitle>
    ...
  </DialogContent>
</Dialog>
```

---

## 6. 键盘 / 快捷键

- `packages/web-components` 的 `shortcutService` 是全局快捷键注册中心。
- 优先级约定：
  1. 系统级（浏览器自身：Ctrl+R / Ctrl+T 等）—— 不要覆盖；
  2. 应用全局（如 `/` 聚焦搜索、`Esc` 关闭顶层浮层）—— 通过 `shortcutService.register` 注册；
  3. 局部组件（如 Tiptap 内的 Cmd+B）—— 在组件 mount 时注册，unmount 时一定 `unregister`。
- 注册同一组合键时，后注册者覆盖先者；移除时必须传同样的 handler 引用，否则泄漏。

✅ 推荐：

```tsx
useEffect(() => {
  const off = shortcutService.register('Escape', closeTopOverlay);
  return off; // register 应返回 unregister fn
}, []);
```

---

## 7. 手势（移动端）

- 项目**未引入** Hammer.js / use-gesture 等手势库；
- 移动端手势统一用浏览器原生事件：`touchstart` / `touchmove` / `touchend` 或更现代的 `pointerdown` / `pointermove` / `pointerup`；
- 简单滑动关闭 Drawer 推荐：在 `motion.div` 上用 `drag="y"` + `dragConstraints` + `onDragEnd` 判定方向；
- 长按、双指缩放等复杂手势：先在 issue 内讨论是否值得引入手势库，避免一次性场景背包；
- 滚动容器内的手势需 `touch-action: pan-y`，否则 iOS 上会和原生滚动竞争。

---

## 8. 反例集

| 反例 | 问题 | 推荐 |
| --- | --- | --- |
| `alert('保存成功')` / `confirm(...)` | 浏览器原生弹窗无法主题化、移动端体验差 | `showAlert` / `showConfirm` |
| 业务错误时 `console.error` 不弹反馈 | 用户无感，以为成功 | 统一 try/catch → `ZmdAlert` |
| 用 Toast 库（react-toastify 等） | 项目无 Toast 体系，引入会分裂反馈层 | 用 `ZmdAlert` |
| 启动阶段忘记 `LoadingManager.endStage` | LoadingScreen 永不消失 | `try/finally` 内成对调用 |
| Modal 没用 `deviceJudge`，PC 弹窗在移动端被压扁 | 视口窄时按钮触达困难 | PC `Dialog` + Mobile `Drawer` 两份 |
| Suspense fallback 写 `"Loading..."` 纯文本 | 视觉跳变 | 用 `LogoLoading` |
| 在 Tiptap 浮层 portal 外注册全局 Escape，关闭后冲突 | unmount 没 unregister，泄漏 | `useEffect` 返回 cleanup |
| 提交按钮无 loading | 用户连点 → 重复请求 | `<Button loading />` |
| 业务层直接 `setError(state)` 又拼字符串 | 错误文案无 i18n、无兜底 | `i18nService.translate(..., { defaultValue: '...' })` |
| 浮层内 `sticky top-0` 没 safe-area | iOS 刘海覆盖 | `pt-[env(safe-area-inset-top)]` |
| 401 时业务自己跳登录 | 与 `unauthorizedHandler` 双重处理 | 让 `ServerService` 的 refresh 队列处理 |

---

## 相关文档

- UI 规范：`docs/UI-GUIDELINES.md`
- 数据流转规范：`docs/DATA-FLOW.md`
- 国际化规范：`docs/I18N.md`
- 项目说明：`CLAUDE.md`
