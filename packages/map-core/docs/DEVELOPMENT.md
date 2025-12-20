# Map-Core 开发文档

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
# 在项目根目录
pnpm install
```

### 构建

```bash
# 构建 map-core
cd packages/map-core
pnpm build
```

### 运行测试

```bash
pnpm test       # 监视模式
pnpm test:run   # 单次运行
```

---

## 基础使用

### 初始化地图

```typescript
import { EndfieldMapAdapter, MapIndex } from '@endfieldmap/map-core';

const adapter = new EndfieldMapAdapter({
  container: document.getElementById('map')!,
  asset: {
    mapImagePath: '/assets/map/',
    entityImagePath: '/assets/entity/',
  },
  jsonLoader: yourJsonLoader,
  map: {
    zoom: 3,
    center: [0, 0],
  },
});

// 渲染地图
await adapter.renderMap(MapIndex.MAP01);

// 渲染实体
await adapter.renderEntity(MapIndex.MAP01);

// 销毁
adapter.dispose();
```

### 事件监听

```typescript
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { MAP_EVENT } from '@endfieldmap/map-core/const';

// 监听实体点击
const dispose = mapEventEmitter.on(MAP_EVENT.ENTITY_CLICK, (detail) => {
  console.log('Entity clicked:', detail.instance);
});

// 监听缩放变化
mapEventEmitter.on(MAP_EVENT.ZOOM_CHANGE, (zoom) => {
  console.log('Zoom:', zoom);
});

// 一次性监听器（触发后自动移除）
mapEventEmitter.once(MAP_EVENT.MAP_CLICK, (event) => {
  console.log('Map clicked once:', event.coordinate);
});

// 取消监听
dispose();

// 获取监听器数量
const count = mapEventEmitter.listenerCount(MAP_EVENT.ENTITY_CLICK);

// 检查是否有监听器
if (mapEventEmitter.hasListeners(MAP_EVENT.ZOOM_CHANGE)) {
  console.log('Has zoom listeners');
}

// 移除所有监听器
mapEventEmitter.removeAllListeners(MAP_EVENT.ENTITY_CLICK);
```

---

## 控制器 API

### EntityController

```typescript
const entityController = adapter.entityController;

// 可见性控制
entityController.showEntity('trchest');      // 显示指定类型
entityController.hideEntity('trchest');      // 隐藏指定类型
entityController.toggleEntityVisible('trchest'); // 切换可见性
entityController.showAllEntities();          // 显示全部
entityController.hideAllEntities();          // 隐藏全部

// 按分类控制
entityController.showCategoryEntities('mineral');
entityController.hideCategoryEntities('mineral');

// 标记过滤
entityController.showOnlyMarked();    // 仅显示已标记
entityController.showOnlyUnmarked();  // 仅显示未标记
entityController.showAll();           // 显示全部

// 聚合控制
entityController.setClusterEnable(true);
entityController.toggleClusterEnable();

// 获取统计信息
const stats = entityController.currentStats;
const categorizedStats = entityController.currentCategorizedStats;

// 数据导入/导出
const markedData = entityController.exportMarked();
await entityController.importMarked(markedData);
```

### ElectricPoleController

```typescript
const electricController = adapter.electricPoleController;

// 创建/删除电线杆
const pole = electricController.createElectricPole(MapIndex.MAP01, [100, 200]);
electricController.deleteElectricPole(MapIndex.MAP01, pole.id);

// Zone 可见性
electricController.setZoneVisible(true);
electricController.toggleZoneVisible();

// 电线杆可见性
electricController.setElectricPoleVisible(true);
electricController.toggleElectricPoleVisible();

// 数据导入/导出
const data = electricController.exportMarked();
electricController.importMarked(data);
```

### CustomPointController

```typescript
const customController = adapter.customPointController;

// 创建自定义标点
const point = customController.createCustomPoint(
  MapIndex.MAP01,
  [100, 200],
  'custom_point_1'  // 支持 custom_point_1 ~ custom_point_7
);

// 删除标点
customController.deleteCustomPoint(MapIndex.MAP01, point.id);

// 可见性控制
customController.setCustomPointVisible(true);
customController.toggleCustomPointVisible();
```

### 撤销/重做

```typescript
import { 
  historyManager, 
  ElectricPoleControllerWithHistory,
  CustomPointControllerWithHistory 
} from '@endfieldmap/map-core';

// 使用带历史记录的包装器
const epWithHistory = new ElectricPoleControllerWithHistory(
  adapter.electricPoleController
);
const cpWithHistory = new CustomPointControllerWithHistory(
  adapter.customPointController
);

// 创建电线杆（自动记录历史）
epWithHistory.create(MapIndex.MAP01, [100, 200]);

// 批量创建
epWithHistory.batchCreate(MapIndex.MAP01, [
  [100, 200],
  [150, 250],
  [200, 300],
]);

// 撤销/重做
if (historyManager.canUndo) {
  historyManager.undo();
}
if (historyManager.canRedo) {
  historyManager.redo();
}

// 查看历史记录
console.log('Undo count:', historyManager.undoCount);
console.log('Redo count:', historyManager.redoCount);
console.log('Undo descriptions:', historyManager.getUndoDescriptions());
```

---

## 数据管理

### DataInstance 状态

每个 DataInstance 拥有以下状态：

```typescript
interface DataInstance {
  // 状态属性（响应式）
  marked: boolean;    // 是否已标记（用户收集）
  selected: boolean;  // 是否被选中（框选）
  active: boolean;    // 是否激活（当前聚焦）
  visible: boolean;   // 是否可见

  // 方法
  setMarked(value: boolean): void;
  toggleMarked(): void;
  setSelected(value: boolean): void;
  toggleSelected(): void;
  setActive(value: boolean): void;
  toggleActive(): void;
}
```

### 访问数据管理器

```typescript
// 获取 EntityMapDataManager
const dataManager = entityController.getDataManager();

// 获取指定类型的组管理器
const groupManager = entityController.getGroupManager('trchest');

// 遍历所有实例
groupManager?.instances.forEach(instance => {
  console.log(instance.data.levelLogicId, instance.marked);
});
```

---

## 渲染定制

### 自定义样式

使用 `src/render/factory.ts` 中的工厂函数创建样式：

```typescript
import { 
  createCircleStyle, 
  createIconStyle, 
  createClusterStyle 
} from '@endfieldmap/map-core/render/factory';

// 创建圆形样式
const circleStyle = createCircleStyle(
  12,        // 半径
  '#ff0000', // 填充色
  2,         // 描边宽度
  '#000000'  // 描边色
);

// 创建图标样式
const iconStyle = createIconStyle(
  '/path/to/icon.png',
  24,   // 尺寸
  12,   // 圆半径（用于偏移）
  2     // 边框宽度
);

// 创建聚合样式
const clusterStyle = createClusterStyle({
  radius: 20,
  size: 5,
  bgColor: '#3366ff',
  textColor: '#ffffff',
});
```

---

## 类型定义

### 实体数据类型

```typescript
import type { 
  EntityData,
  ElectricPoleData,
  CustomPointData,
  EntityInfoData,
  Category
} from '@endfieldmap/map-core/types';

// 实体数据
interface EntityData {
  levelLogicId: number;
  entityDataIdKey: string;
  templateId: string;
  entityType: string;
  position: Position;
  defaultHide?: boolean;
  properties: EnityProperties;
}

// 分类类型
type Category = 
  | 'trchest' | 'dungeon' | 'enemy' | 'ether'
  | 'mineral' | 'narrative' | 'plant' | 'settlement'
  | 'spcstone' | 'system' | 'special' | 'dnarrative';
```

### 事件类型

```typescript
import type {
  EntityEventDetail,
  ClusterEventDetail,
  MapContextMenuEventDetail,
  ActiveFeatureChangeEventDetail,
} from '@endfieldmap/map-core/types';

// 实体事件详情
interface EntityEventDetail {
  instance: DataInstance;
  feature: FeatureLike;
  event: MapBrowserEvent;
}

// 聚合点击事件详情
interface ClusterEventDetail {
  features: Feature<Point>[];
  instances: EntityDataInstance[];
  coordinates: Coordinate[];
  extent: Extent;
  event: MapBrowserEvent;
}
```

---

## 常见模式

### 地图切换

```typescript
async function switchToMap(mapIndex: MapIndex) {
  // 1. 切换底图
  await adapter.renderMap(mapIndex);
  
  // 2. 切换实体层
  await adapter.renderEntity(mapIndex);
  
  // 3. 切换电线杆层
  await adapter.renderElectricPole(mapIndex);
  
  // 4. 切换自定义标点层
  await adapter.renderCustomPoint(mapIndex);
}
```

### 实体定位

```typescript
// 定位到指定坐标
adapter.mapController.mapRenderer.map.getView().animate({
  center: [x, y],
  zoom: 4,
  duration: 500,
});
```

### 添加自定义控件

```typescript
import Control from 'ol/control/Control';

class MyControl extends Control {
  constructor() {
    const element = document.createElement('div');
    element.className = 'my-control';
    element.innerHTML = '<button>Click</button>';
    super({ element });
  }
}

adapter.addControl(new MyControl());
```

---

## 调试技巧

### MobX 响应式调试

```typescript
import { autorun, reaction } from 'mobx';

// 监听状态变化
autorun(() => {
  console.log('Cluster enabled:', entityController.clusterEnable);
});

// 监听特定属性
reaction(
  () => entityController.markedFilterMode,
  (mode) => console.log('Filter mode changed:', mode)
);
```

### OpenLayers 调试

```typescript
// 获取 OL Map 实例
const olMap = adapter.mapController.mapRenderer.map;

// 获取所有图层
olMap.getLayers().forEach(layer => {
  console.log(layer.get('layerType'));
});

// 获取当前视图状态
const view = olMap.getView();
console.log({
  center: view.getCenter(),
  zoom: view.getZoom(),
  rotation: view.getRotation(),
});
```

---

## 最佳实践

### 1. 内存管理

```typescript
// ✅ 正确：保存 dispose 函数并在清理时调用
const disposeClick = mapEventEmitter.on(MAP_EVENT.ENTITY_CLICK, handler);
const disposeHover = mapEventEmitter.on(MAP_EVENT.ENTITY_HOVER, handler);

// 组件卸载时
disposeClick();
disposeHover();
adapter.dispose();

// ❌ 错误：忘记清理监听器
mapEventEmitter.on(MAP_EVENT.ENTITY_CLICK, handler); // 内存泄漏
```

### 2. 性能优化

```typescript
// ✅ 批量更新可见性
entityController.hideAllEntities();
// 然后只显示需要的
entityController.showEntity('trchest');

// ❌ 频繁单个操作
entities.forEach(e => entityController.toggleEntityVisible(e));
```

### 3. 类型安全

```typescript
// ✅ 使用类型导入
import type { EntityData, MapIndex } from '@endfieldmap/map-core';

// ✅ 使用枚举而非魔法值
adapter.renderMap(MapIndex.MAP01);

// ❌ 硬编码字符串
adapter.renderMap('001' as any);
```

---

## 故障排除

### 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 地图不显示 | 容器高度为 0 | 确保容器有明确的高度 |
| 实体不渲染 | 数据未加载 | 检查 jsonLoader 是否正确 |
| 事件不触发 | 监听器注册顺序 | 确保在渲染前注册 |
| 聚合不工作 | 缩放级别过高 | 调整 clusterDistance |

### 获取帮助

1. 查看 `src/types/` 下的类型定义
2. 检查 `src/const/` 下的常量配置
3. 阅读控制器源码了解详细实现
