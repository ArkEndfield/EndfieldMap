---
'@endfieldmap/map-core': minor
'@endfieldmap/map-service': minor
'@endfieldmap/map-adapter-ol': minor
---

支持按三维游戏坐标判定所在分层（数据来自 endfield-workflow maps v3 产出的 `tier_volumes.json`）：新增 `TierVolume` 系列类型与 `locateTierVolume` / `isInTierShape`，规则与数据管线给标点分配 `mapRegionId` 的一致（只看所在关卡的体积，priority 最高者胜，同级取列表靠前者；盒体 / 多边形柱体，高度闭区间）。`TierDataManager` 新增 `setTierVolumes`、`hasTierVolumes`、`locateTierRegion`；OL `TierController` 新增不移动视图的 `showTier`。

`GridTiersDataService` 同时加载 `tier_volumes.json`（缺失或版本不符时仅告警，分层照常显示），并用其中每张分层图的精确范围锚定叠加图：`GridTierItem.items[].bounds` 存在时按图片自身的左下角 / 右上角定位，不再一律锚在分组 lb、按图片尺寸推算（修正同组分层图起点不一致时的错位，如遂明 tier 425 横向偏 128）。
