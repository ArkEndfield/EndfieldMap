---
'@endfieldmap/map-service': minor
---

森空岛（终末地）联动与采集路线：

- 新增 `SklandSyncService`（地图标点双向同步：`preview` 只读比对 → 冲突弹窗人工选择 → `applyLocal`/`pushRemote` 分向应用）、`SklandPositionService`（角色实时位置轮询）与 `SklandRouteService`（森空岛路线浏览 / 导入 / 发布 / 删除），对接 DijiangV2 的 `/user/game-roles/*` 端点。
- 新增采集路线规划：地图上描点新建路线（草稿虚线、单点有起点反馈）、从森空岛导入（仅本地暂存，不把上游数据落到本站服务端）、发布 / 取消发布、列表内联重命名与删除；渲染侧为 `RouteController` + 独立折线图层（当前仅 ol 适配器，接口按可选成员暴露）。
- 用户数据库按 `(userId, roleId)` 分库，切换游戏角色不再共用一份数据；`replicationIdentifier` 升级为包含库名与角色——**所有用户升级后的首次同步会全量重拉一次**（云端数据不变，仅本地重建索引）。
- 「清除本地数据」前先停止同步，避免清库产生的本地删除被推成云端墓碑；marked/visibility 改为全量差分重放，修复换库后事件丢失。
