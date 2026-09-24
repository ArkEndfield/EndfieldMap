---
'@endfieldmap/map-core': minor
'@endfieldmap/map-service': patch
'@endfieldmap/map-adapter-ol': patch
---

支持地图 ID 带下划线的单关卡独立地图（数据侧把原 `indie` 拆成 `indie_dg007` 首墩内部、`indie_dg016` 遂明）：`MapData` 新增可选 `aliases`（改名/拆分前的旧地图 ID），`MapDataManager.getMapData` / `setCurrentMap` 认旧 ID，新增 `resolveMapId` 与按最长地图 ID 前缀归属关卡级 key 的 `getMapIdByLevelKey`。

`GridTiersDataService` 改用 `getMapIdByLevelKey` 归图（原先 `id.split('_')[0]` 会把 `indie_dg007_3_3` 归到不存在的 `indie`，抛错中断全部层级注册），未知地图的层级跳过；`MapStateDataService` 启动时把存储里已改名或下线的当前地图解析到新图或回退第一张图，不再让加载页停在 `Invalid map id`；OL `EntityController` 对 map_data 里没有的实体地图只跳过渲染（实体 JSON 与 map_data 版本错开时不再整站加载失败）。
