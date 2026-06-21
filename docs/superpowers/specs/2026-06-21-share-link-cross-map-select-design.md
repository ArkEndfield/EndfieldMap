# Share Link — Cross-Map `select` Recognition & Prompt (Design)

> 续接 `2026-05-29-share-link-design.md`。该文档已实现 `?map=&id=&select=` 的识别与跳转；本设计补齐 **`select` 类型不在目标地图时的提示 / 切换 / 底部标签条** 行为。

## 1. 背景与缺口

现有 `applyShareLinkParams()`（`apps/web/src/services/share_link.ts`）对 `select` 中**不在目标地图**的 `entityDataIdKey` 仅静默跳过（`setGroupVisibility` 找不到分组 → `logger.debug`）。用户无从得知该类标点其实存在于别的地图。

本设计：
1. 当 `select` 含不在当前/目标地图的类型时，用 **alert** 提示其所在地图，并按规则**自动切换**或**询问切换**。
2. 复用 `operation_list.tsx`（`OperationList`）在**底部**常驻展示 `select` 的全部选择项，对**非当前地图**的项做**右上角徽章**标记。

## 2. 行为规则（已与需求方确认）

### 2.1 切换策略：单个自动 · 多个询问
- `offMap` 为空 → 不提示、不切换。
- 链接带 `id`（指定标点，锚定地图）→ **仅提示，不切换**。
- `selectKeys.length === 1` 且该项不在当前图 → **自动切换**到该类型所在地图。
- 否则（多项且含越图项）→ **弹确认框询问**，目标 = 覆盖最多 `offMap` 类型的地图（并列取 `select` 中更靠前者）；取消则留在原图。

### 2.2 底部标签条交互：跨图跳转 · 本图切显隐
- 点击带徽章（非本图）的标签 → `setCurrentMap` 切换到该类型所在地图。
- 点击本图标签 → `setEntityGroupVisibility` 切换该类型显隐。

### 2.3 显示时机：随参数常驻 · 可关闭
- URL 带 `select` 参数即显示。
- 关闭按钮 → 隐藏并 `urlStateManager.removeParam('select')`。
- 切换地图时徽章实时更新。

## 3. 架构选型

底部标签条状态用 **MobX store**（`shareSelectStore`），仿 `contextMenuManager` 模式：
- 解耦命令式 `MapService` 初始化流程与 React 渲染。
- 关闭 / 常驻 / 实时徽章天然支持。
- 放 `apps/web/src/services`（web-only UI 状态，符合 CLAUDE.md 的服务边界）。

否决：URL 直驱（非响应式，关闭/更新别扭）、React Context（难从命令式流程写入）。

## 4. 数据来源（均已核实可观测）

- `service.adapterRegistry.adapter.entityController.dataManager.mapData`：`Map<mapId, Map<entityDataIdKey, EntityGroupManager>>`（`@observable accessor`）。反建 `Map<entityDataIdKey, mapIds[]>` 即得"某类标点在哪些地图存在"。
- `groupManager.stats`：`EntityInfoStats`（`uniqueKey/category/entityDataIdKey/entityInfo/visible/count/...`），供 chip 渲染。
- `service.dataService.mapDataService.mapStateDataService.currentMap.value`（`LocalStorageValue._value` 为 `@observable accessor`）；`.setCurrentMap(mapId)` 切换并重渲染。
- `service.dataService.mapDataService.entityDataService.setEntityGroupVisibility(mapId, key, true)`：设显隐（含持久化）。
- `service.dataService.mapDataService.moveToEntity(id, true, true)`：跨图定位实体（`id` 用）。
- 展示：`useEntityName(stats)` 取名、`getEntityIcon(category, entityInfo.pic)` 取图标、`t('lang:'+mapData.name)` 取地图显示名、`service.i18nService.translate` 命令式取词。
- alert：`alert.info(string|config)`、`alert.confirm(config): Promise<boolean>`，`content` 支持任意 `ReactNode`。

## 5. 模块设计

### 5.1 `share_link_resolve.ts`（新增，纯函数）

```ts
export interface SelectHomeInfo {
  key: string;
  homeMaps: string[]; // 含该 key 的地图（不含 targetMapId）
}

export interface SelectResolution {
  onMap: string[];                 // 在 targetMapId 上的 key（按 select 顺序）
  offMap: SelectHomeInfo[];        // 不在 targetMapId、但在别图上的 key
  unknown: string[];               // 任何地图都没有的 key（失效）
  switchMode: 'auto' | 'ask' | 'none';
  switchTarget: string | null;     // auto/ask 的目标地图
}

/** mapsByKey: entityDataIdKey -> 含该 key 的全部 mapId */
export function resolveSelectPlacement(
  mapsByKey: ReadonlyMap<string, string[]>,
  selectKeys: string[],
  targetMapId: string,
  hasAnchorId: boolean
): SelectResolution;
```

`switchMode`：
- `offMap.length === 0` → `'none'`，target `null`
- `hasAnchorId` → `'none'`，target `null`
- `selectKeys.length === 1` → `'auto'`，target = `offMap[0].homeMaps[0]`
- 否则 → `'ask'`，target = 覆盖最多 `offMap` 的地图（并列取 select 更靠前）

辅助：`buildMapsByKey(mapData)` 反建索引（也可放此模块）。

### 5.2 `share_select_store.ts`（新增，MobX）

```ts
class ShareSelectStore {
  @observable accessor selectKeys: string[] = [];
  @observable accessor visible: boolean = false;
  setSelect(keys: string[]): void;  // keys 非空时 visible=true
  close(): void;                    // visible=false + 清 selectKeys
}
export const shareSelectStore = new ShareSelectStore();
```

### 5.3 `share_link.ts`（修改 `applyShareLinkParams`）

执行顺序：
1. `map`：校验，`setCurrentMap`；`targetMapId = map ?? currentMap.value`。
2. 在图 `select` 显隐：对存在于 `targetMapId` 的 key 调 `setEntityGroupVisibility(targetMapId, key, true)`。
3. `id`：若有 → `moveToEntity(id)`（可能切图）；之后重读 `currentMap.value` 作为新的 `targetMapId`，补应用在新图上的 select 显隐。
4. 解析剩余 offMap：`resolveSelectPlacement(buildMapsByKey(mapData), selectKeys, targetMapId, hasId)`。
5. 按 `switchMode` 执行 + alert（仅当 `offMap.length > 0`）：
   - `auto`：`setCurrentMap(target)` → 补显隐 → `alert.info(已切换)`。
   - `ask`：`alert.confirm(...)` → true 则 `setCurrentMap(target)` + 补显隐；false 留原图。
   - `none` 且 `offMap>0`（带 id）：`alert.info(分别位于…)`。
6. `unknown`：`logger.warn`，不进标签条。
7. `shareSelectStore.setSelect(selectKeys)`。

### 5.4 `ui/share_select/`（新增 UI）

- `index.tsx` — `ShareSelectBar`（`observer`）：读 `shareSelectStore` + 当前图 + `mapData`；复用 `<OperationList position="bottom">` 渲染 chip 列表 + 关闭按钮。
- `chip.tsx` — 单个标签：图标 + 名称（仿 `EntityItem` 胶囊）；`isOffMap` 时右上角徽章；点击按 §2.2 分流。
- `alert_content.tsx` — alert 富内容组件：列出 offMap 类型及其所在地图（图标 + 名称 + `→ {mapName}`）。

### 5.5 `operation_list.tsx`（修改）

新增 `position?: 'top' | 'bottom'`（默认 `'top'`）。`'bottom'` 时外层 `motion.div` 定位改为底部居中（如 `bottom-*`），并预留移动端安全偏移；现有 top 行为不变。

### 5.6 挂载

在 endfield 地图 UI 层（`Map.tsx` 中 `OperationTip` 同级，或 `ThemedComponents.map.*` 新增条目）渲染 `<ShareSelectBar />`。具体挂载点在实现时确认。

## 6. i18n（`common` 命名空间，14 语言，之后 `pnpm lng:type`）

新增约：
| key | zh-CN |
|---|---|
| `share_link.not_on_current_map` | 该标点类型不在当前地图 |
| `share_link.not_on_map_switched` | 〔{{category}}〕不在当前地图，已切换到〔{{map}}〕 |
| `share_link.not_on_map_ask` | 部分标点类型不在当前地图，是否切换到〔{{map}}〕查看？ |
| `share_link.exists_on` | {{category}} · 位于 {{map}} |
| `share_select.close` | 关闭 |

## 7. 测试

- `share_link_resolve.test.ts`（主覆盖，TDD）：
  - 全在图 → `none`、`offMap=[]`。
  - 带 id + 有 offMap → `none`（info）。
  - 单个越图 → `auto`，target 正确。
  - 多个越图 → `ask`，best-coverage 正确；并列取靠前。
  - `unknown`（任何图都没有的 key）正确归类、不影响切换。
- UI 仅轻量冒烟（store / chip 分流），不强求重型测试。

## 8. 边界

- offMap 某 key 多 homeMap：auto 取首个；ask 的最佳图按覆盖度。
- `id` 与 select 冲突：`id` 优先锚定，越图 select 仅提示 + 徽章。
- key 在 `infoData` 有、但所有地图分组都没有 → `unknown`，跳过 chip。
- 关闭标签条后清 URL `select`，再次分享不携带。

## 9. 文件清单

| 文件 | 动作 |
|---|---|
| `apps/web/src/services/share_link_resolve.ts` | 新增（纯函数） |
| `apps/web/src/services/share_link_resolve.test.ts` | 新增（单测） |
| `apps/web/src/services/share_select_store.ts` | 新增（MobX store） |
| `apps/web/src/services/share_link.ts` | 修改（接入解析/alert/store） |
| `apps/web/src/components/themes/endfield/ui/share_select/index.tsx` | 新增（ShareSelectBar） |
| `apps/web/src/components/themes/endfield/ui/share_select/chip.tsx` | 新增（chip + 徽章） |
| `apps/web/src/components/themes/endfield/ui/share_select/alert_content.tsx` | 新增（alert 富内容） |
| `apps/web/src/components/themes/endfield/components/topbar/operation_list.tsx` | 修改（position 参数） |
| `Map.tsx` / 地图 UI 层 | 修改（挂载 ShareSelectBar） |
| `packages/map-service/src/locales/*/common.json` ×14 | 修改（i18n） |
| `packages/map-service/src/@types/resources.d.ts` | 重新生成（`pnpm lng:type`） |
