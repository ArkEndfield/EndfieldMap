---
'@endfieldmap/map-service': minor
'@endfieldmap/web-components': minor
'@endfieldmap/map-web-theme-types': minor
---

新增 AI 助手服务：`AiService`（配置 / OpenAI 兼容客户端 / 会话）与 `AiToolset`，注册 7 个工具：`get_map_context`、`list_point_groups`、`query_points`（点位查询）、`focus_point`（定位）、`mark_points`（批量标记）、`highlight_points`（高亮）、`plan_collection_route`（采集路径规划）。供应商 baseUrl 与 API Key 由前端自行配置且只存本机，会话仅内存态不落盘；`RouteDataService` 增加 `saveRouteFromPoints`，可把一组有序点位直接存成本地路线；文案补齐 7 个 locale 的 `settings:ai.*`。

`EndfieldInput` 新增 `autoFocus`（默认 `true`，保持原行为）与 `value` 受控模式，同一页面放多个输入框时不再互相抢焦点。

修复 `i18next.config.ts` 缺少 `types` 配置：`pnpm lng:type` 原本会走源码提取（本包几乎没有 `t()` 调用），把 `resources.d.ts` 清空；现在显式从 `src/locales/zh-CN/*.json` 生成。
