# UI 规范（UI Guidelines）

## 1. 本文档目的与适用范围

本文档定义 EndfieldMap 的视觉与界面规范，约束 `apps/web`（Vite + React 19 + Tailwind v4 SPA）与共享 UI 包 `packages/web-components` 的所有可见 UI 输出，目的是：

- 统一字体、字号、颜色、间距、圆角、动画的来源与命名；
- 明确 PC / 移动端拆分原则与移动端验证最低门槛；
- 给出"用哪个组件、写在哪一层"的决策树，避免重复造轮子；
- 规定 Motion / GSAP 的选择规则，避免同节点动画相互抢占。

适用于 `apps/web/src/**`、`packages/web-components/src/**` 与 `apps/web/src/components/themes/endfield/**`。`apps/native`（Expo / RN）不在本规范覆盖范围，但共享逻辑须保留跨平台抽象（详见 `docs/DATA-FLOW.md`）。

---

## 2. 视觉语言

### 2.1 字体栈

主字体栈定义在 `apps/web/src/index.css`：

```
font-family: 'Noto Sans SC', 'Outfit', 'JetBrains Mono', sans-serif;
.font-serif → 'Noto Serif SC'
```

| 用途 | Class / Token | 字体 |
| --- | --- | --- |
| 正文 / UI | 默认（无需 class） | Noto Sans SC → Outfit |
| 数字 / 等宽 | `font-mono` | JetBrains Mono |
| 标题 / 装饰 | `font-serif` | Noto Serif SC |

> 注意：当前通过 `@import url(https://fonts.googleapis.com/css2?...)` 加载多权重字体，已知会阻塞首屏。本规范不展开修法，详见 `PERF-AUDIT.md`。在性能改造完成前，**不要再新增 Google Fonts `@import`**；新字重需通过本地 `@font-face` + `font-display: swap` 自托管。

### 2.2 字号阶（沿用 Tailwind 默认）

只使用 Tailwind v4 默认字号阶（`text-xs` → `text-9xl`）。不要内联 `style={{ fontSize: '13px' }}` 之类的非阶字号。

| 场景 | 推荐 |
| --- | --- |
| 辅助说明 / Badge | `text-xs` / `text-sm` |
| 正文 | `text-base` |
| 二级标题 | `text-lg` / `text-xl` |
| 一级标题 / Hero | `text-2xl` 起 |

行高跟随 Tailwind 默认（`leading-tight` / `leading-snug` / `leading-normal` / `leading-relaxed`）。在中文段落场景偏向 `leading-relaxed` 以避免堆叠感。

### 2.3 颜色 token

颜色 token 集中定义在 `apps/web/src/index.css`（Tailwind v4 的 `@theme` 块）。新增颜色必须：

1. 先加入 `@theme` 作为 token（`--color-xxx`），让 Tailwind 自动生成 `bg-xxx` / `text-xxx` 等 utility；
2. 再在组件里使用 utility，**禁止**直接 `style={{ color: '#xxxxxx' }}`；
3. 同步检查 light + dark 两套（即便目前 dark 未启用，见 2.4）。

### 2.4 `.dark` variant 的当前状态

`apps/web/src/index.css` 注册了：

```css
@custom-variant dark (&:where(.dark, .dark *));
```

**目前未发现实际向 `<html>` 添加 `class="dark"` 的代码路径，dark 变体处于闲置状态**。但作为硬要求：

- 任何颜色 token / 主题 token 改动 **必须同时声明 light 与 dark 两套**（即使现在不会被触发）；
- 新增组件如有不同主题色，仍写 `dark:` 前缀；
- 待 ThemeToggle 启用后无需返工。

✅ 推荐：

```tsx
<div className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100" />
```

❌ 反例：

```tsx
<div style={{ background: '#fff', color: '#222' }} />
// 既缺 token，也无 dark 分支
```

---

## 3. 间距与圆角

### 3.1 间距

沿用 Tailwind v4 默认 spacing 阶（`0` / `px` / `0.5` / `1` / `1.5` / `2` …）。常用约定：

| 层级 | 间距 |
| --- | --- |
| 紧凑控件内边距 | `p-1.5` / `p-2` |
| 卡片 / 容器内边距 | `p-4` / `p-6` |
| 区块之间 | `gap-4` / `gap-6` / `gap-8` |
| 页面段落分隔 | `mt-12` / `my-16` |

### 3.2 圆角

| 用途 | 推荐 |
| --- | --- |
| 标签 / 小按钮 | `rounded` / `rounded-md` |
| 卡片 / 弹层 | `rounded-lg` / `rounded-xl` |
| 头像 / 圆形按钮 | `rounded-full` |

不要混用 `rounded-[7px]` 这类裸数值；如确需特殊圆角，先抽 token。

---

## 4. 响应式与断点

### 4.1 项目唯一行为断点：768px

- 移动端判断：`packages/web-components` 暴露 `useIsMobile()`，内部使用 `matchMedia('(max-width: 768px)')`。
- PC / Mobile 拆分组件：`apps/web/src/components/common/device_judge.tsx` 的 HOC `deviceJudge(PCComponent, MobileComponent, ExtraWrapper?)`。

✅ 推荐：

```tsx
import { deviceJudge } from '@/components/common/device_judge';

const Sidebar = deviceJudge(SidebarPC, SidebarMobile);
```

❌ 反例：

```tsx
// 在组件内手写 if (window.innerWidth < 768)，不响应 resize、SSR 不安全
const Comp = () => (window.innerWidth < 768 ? <Mobile /> : <PC />);
```

### 4.2 Tailwind 五断点（视觉调整使用）

Tailwind v4 默认断点 `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536` 全部可用，仅用于"同一组件在不同尺寸下的视觉调整"，而**不**用来切换 PC / Mobile 两份完全不同的实现（那是 deviceJudge 的活）。

### 4.3 移动端验证清单（硬要求）

每一处 UI 改动合入前，必须在以下采样下手测通过：

- 断点：`sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536；
- 物理采样：iPhone SE（375）/ iPhone 14 Pro（393）/ iPad（768）。

需要重点验证的浮层场景：

- Tiptap / BubbleMenu / Toolbar 在小屏 wrap 后是否压住编辑器首行；
- `sticky top-14` 类元素是否撞到 safe-area-inset-top；
- Modal / Drawer 内嵌的 portal 是否跳出了父级的 `backdrop-filter` 包含块（会丢失模糊）；
- 横屏下虚拟键盘弹起时 `100vh` 是否需要替换为 `100dvh`。

---

## 5. 组件来源选择树

新组件需求落地前，按以下顺序检索：

```
1. packages/web-components (Storybook 组件库, 跨 web/native 共享)
   ├─ alert / button / button_with_audio / close_button / dialog / icons
   ├─ input / logo_loading / scroll_area / select / switch / toggle / tooltip
   ↓ 命中 → 直接 import 使用
   ↓ 未命中且为"通用基础控件"（可被多个业务复用）
   ↓ → 在 packages/web-components 新增（带 Storybook + 测试）

2. apps/web/src/components/themes/endfield/  ← 单主题，业务组件
   ↓ 命中 → 直接 import 使用
   ↓ 未命中且为"业务/页面组件"
   ↓ → 在 themes/endfield 下新增

3. 一次性 inline（仅限页面级 / 不会复用）
```

硬约束：

- **禁止重写已有组件**。例如不要因为 `Button` 不带某个 prop 就在业务里手写一个新的 `<button>`，应当扩展 `web-components/button`。
- 业务组件需要的图标统一从 `web-components/icons` 引入；新图标加到 `icons` 包后再用。
- 主题在 `components/themes/endfield/`，**当前是单主题**。短期内不要为新组件预留 `themeName` 参数。

---

## 6. 动画

### 6.1 选择规则

| 场景 | 工具 | 备注 |
| --- | --- | --- |
| 组件级 transition / `AnimatePresence` / `layout` / 简单手势 | `motion`（framer-motion 替代） | **默认选择** |
| 多阶段时间线 / 文字 shuffle / 复杂序列（如 `shuffle_text.tsx`） | `gsap` + `@gsap/react` | 仅当 motion 难以表达时 |
| 高频纯 CSS（spinner、跑马灯、3D 旋转） | Tailwind 自定义 keyframes | 见 `apps/web/src/index.css` 中 `animate-spinner-ease-spin` / `animate-spinner-linear-spin` / `animate-marquee` / `rotate3d` |

### 6.2 不可违反

- **同一节点不要同时使用 motion 和 gsap**——两者都会写 `transform` / `opacity`，互相覆盖。如必须叠加，把 motion 包在外层 wrapper，gsap 操作内层子节点。
- 列表进出场用 `<AnimatePresence>` + `motion.div` 的 `initial / animate / exit`，不要手写 setTimeout 配 class。
- 长循环动画（marquee / spinner）优先 CSS keyframes，而非 motion 的 `repeat: Infinity`，可保证页面空闲时被浏览器节流。

✅ 推荐：

```tsx
import { motion, AnimatePresence } from 'motion/react';

<AnimatePresence>
  {open && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      ...
    </motion.div>
  )}
</AnimatePresence>;
```

❌ 反例：

```tsx
// 同一 ref 既被 motion 控制又被 gsap.to 控制
<motion.div ref={ref} animate={{ x: 100 }} />;
useGSAP(() => { gsap.to(ref.current, { x: 200 }); });
```

---

## 7. PWA / 大图标 / safe-area

- PWA manifest 在 `apps/web/public/`（icons / manifest.webmanifest）。新增图标尺寸需保持 `purpose: any maskable` 两份。
- 顶部固定栏（`sticky top-0` / `fixed top-0`）必须叠加 `pt-[env(safe-area-inset-top)]` 或在容器上声明 `padding-top: max(theme(spacing.4), env(safe-area-inset-top))`，否则 iOS 刘海会盖住。
- 底部 Tab / FAB 同理叠加 `pb-[env(safe-area-inset-bottom)]`。
- 全屏 Modal 高度用 `h-[100dvh]` 替代 `h-screen`，避免 iOS 工具栏收起时跳变。

---

## 8. 反例集

| 反例 | 问题 | 推荐 |
| --- | --- | --- |
| 在组件里 `if (window.innerWidth < 768)` 切换分支 | 不响应 resize，SSR/初次渲染错误 | 用 `deviceJudge` HOC 或 `useIsMobile()` |
| 自己包一个 `<button class="bg-blue-500 ...">` | 绕开 web-components Button，破坏一致性 | import `Button` from `@endfieldmap/web-components` |
| `style={{ color: '#3b82f6' }}` | 颜色没 token、无 dark 分支 | 用 Tailwind utility / `@theme` 声明 token |
| 同节点 motion + gsap | transform 抢占，闪烁 | 拆 wrapper 内外两层 |
| 顶栏 `sticky top-0` 未处理刘海 | iOS 刘海覆盖标题 | `pt-[env(safe-area-inset-top)]` |
| 顶栏 `h-screen` | iOS 地址栏收起时跳变 | 用 `h-[100dvh]` |
| 新增颜色没写 `dark:` 分支 | dark 启用后返工 | 写规范即同步两套 |
| 用 Google Fonts `@import` 再加字重 | 首屏阻塞，TBT 上升 | 本地 `@font-face` + `font-display: swap` |

---

## 相关文档

- 交互规范：`docs/INTERACTION.md`
- 数据流转规范：`docs/DATA-FLOW.md`
- 国际化规范：`docs/I18N.md`
- 项目说明：`CLAUDE.md`
