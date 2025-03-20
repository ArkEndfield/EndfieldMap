import { xyz2crd } from '@/utils/common';
import { Feature } from 'ol';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import {
  Circle as CircleStyle,
  Fill,
  Icon,
  Stroke,
  Style,
  Text,
} from 'ol/style';
import { computed, reactive } from 'vue';
import Cluster from 'ol/source/Cluster';
import VectorLayer from 'ol/layer/Vector';

// @ts-ignore
import points from '../assets/output.json';

// 菜单信息
export const entityInfo = reactive({
  int_trchest_common: {
    name: '储藏箱I',
    point: 'int_trchest_common',
    show: true,
    count: 1,
  },
  int_trchest_common_normal: {
    name: '储藏箱II',
    point: 'int_trchest_common',
    show: true,
    count: 1,
  },
  int_trchest_common_high: {
    name: '储藏箱III',
    point: 'int_trchest_common',
    show: true,
    count: 1,
  },
  int_trchest_lock: {
    name: '储藏箱IV',
    point: 'int_trchest_common',
    show: true,
    count: 1,
  },
  int_collection_common: {
    name: '采集',
    point: 'default',
    show: true,
    count: 1,
  },
  int_campfire_v2: {
    name: '传送点',
    point: 'int_campfire_v2',
    show: true,
    count: 1,
  },
  int_blackbox_entry: {
    name: '普通修理',
    point: 'icon_map_blackbox',
    show: true,
    scale: 0.7,
    count: 1,
  },
  int_blackbox_entry_hard: {
    name: '突袭修理',
    point: 'icon_map_blackbox',
    show: true,
    scale: 0.7,
    count: 1,
  },
  int_dungeon_entry_challenge: {
    name: '挑战副本',
    point: 'icon_map_dungeon',
    show: true,
    scale: 0.7,
    count: 1,
  },
  int_dungeon_entry_resource: {
    name: '材料副本',
    point: 'icon_map_dungeon',
    show: true,
    scale: 0.7,
    count: 1,
  },
  int_collection_coin: {
    name: '醚质',
    point: 'item_colllection_ether',
    show: true,
    scale: 0.2,
    count: 1,
  },
  int_collection_coin_puzzle: {
    name: '突袭醚质',
    point: 'item_colllection_ether',
    show: true,
    scale: 0.2,
    count: 1,
  },
});

let index = 1;
const features: Feature<Point>[] = [];
const itemMap: any = {};
const entityGroup: Record<
  string,
  {
    name: string;
    points: Feature<Point>[];
  }
> = {};

// 添加一个全局变量来存储当前的缩放级别
let currentZoomLevel = 3;

// 添加一个函数来获取基于缩放级别的图标缩放因子
export const getIconScaleForZoom = (baseScale: number = 1): number => {
  // 根据缩放级别调整缩放因子
  const zoomScaleFactor = {
    1: 0.5,
    2: 0.5,
    3: 0.6,
    4: 0.8,
    5: 1.0,
  };

  const scaleFactor = zoomScaleFactor[Math.round(currentZoomLevel)] || 1.0;
  return baseScale * scaleFactor;
};

// 添加一个函数来获取基于缩放级别的圆形半径
export const getCircleRadiusForZoom = (baseRadius: number = 20): number => {
  // 根据缩放级别调整圆形半径
  const zoomRadiusFactor = {
    1: 0.6,
    2: 0.7,
    3: 0.8,
    4: 0.9,
    5: 1.0,
  };

  const radiusFactor = zoomRadiusFactor[Math.round(currentZoomLevel)] || 1.0;
  return baseRadius * radiusFactor;
};

// 更新当前缩放级别的函数
export const updateCurrentZoom = (zoom: number) => {
  currentZoomLevel = zoom;
  refreshIconStyles();
};

export interface entityData {
  sceneId: string;
  seq: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  entityDataIdKey: string;
  properties?: any[];
}

export const marker = (entry: entityData) => {
  entry.seq = index++;
  const info = entityInfo[entry.entityDataIdKey];
  if (!info || !info?.show) return;

  const feature = new Feature({
    geometry: new Point(xyz2crd(entry.position)),
    payload: entry,
  });
  feature.setStyle(
    new Style({
      image: new Icon({
        src: `/assets/${
          entityInfo[entry.entityDataIdKey]?.point || 'default'
        }.png`,
        scale: getIconScaleForZoom(entityInfo[entry.entityDataIdKey]?.scale),
      }),
    })
  );
  if (!entityGroup[entry.entityDataIdKey]?.points?.length) {
    entityGroup[entry.entityDataIdKey] = {
      name: info.name,
      points: [feature],
    };
  } else {
    entityGroup[entry.entityDataIdKey].points.push(feature);
    entityInfo[entry.entityDataIdKey].count += 1;
  }
  return feature;
};

// 加载数据
for (const m in points) {
  if (!m.includes('map01')) continue;
  for (const point of points[m]) {
    itemMap[point.entityDataIdKey] = (itemMap[point.entityDataIdKey] || 0) + 1;
    const feature = marker(point);
    if (feature) features.push(feature);
  }
}

console.log('醚质总数:', features.length, itemMap);

// 源数据管理
export const source = new VectorSource({
  features: features,
});

// 样式缓存和图层容器
export const styleCache: { [key: string]: Style | Style[] } = {};
export const entityClusterLayers: VectorLayer<any>[] = [];
export const entityClusterSources: { [key: string]: Cluster } = {};

// 为不同实体类型分配颜色
function getColorForEntity(entityType: string): string {
  const colorMap: { [key: string]: string } = {
    int_trchest_common: 'rgba(255, 153, 0, 0.8)',
    int_trchest_common_normal: 'rgba(255, 153, 0, 0.8)',
    int_trchest_common_high: 'rgba(255, 153, 0, 0.8)',
    int_trchest_lock: 'rgba(255, 153, 0, 0.8)',
    int_collection_common: 'rgba(76, 175, 80, 0.8)',
    int_campfire_v2: 'rgba(33, 150, 243, 0.8)',
    int_blackbox_entry: 'rgba(156, 39, 176, 0.8)',
    int_blackbox_entry_hard: 'rgba(156, 39, 176, 0.8)',
    int_dungeon_entry_challenge: 'rgba(183, 28, 28, 0.8)',
    int_dungeon_entry_resource: 'rgba(183, 28, 28, 0.8)',
    int_collection_coin: 'rgba(255, 235, 59, 0.8)',
    int_collection_coin_puzzle: 'rgba(255, 235, 59, 0.8)',
  };

  return colorMap[entityType] || 'rgba(128, 128, 128, 0.8)';
}

// 刷新所有图标样式的函数
export const refreshIconStyles = () => {
  // 清除样式缓存，这样下次渲染时会重新计算样式
  Object.keys(styleCache).forEach(key => delete styleCache[key]);

  // 强制刷新所有聚合图层
  Object.values(entityClusterSources).forEach(source => {
    source.refresh();
  });
};

// 按实体类型分组创建聚合源和图层
export const createEntityClusterLayers = () => {
  // 先清空现有的图层
  entityClusterLayers.length = 0;

  // 按实体类型分组
  const featuresByType: { [type: string]: Feature<Point>[] } = {};

  // 将所有特征按类型分组
  for (const feature of features) {
    const entityType = feature.get('payload')?.entityDataIdKey;
    if (!entityType) continue;

    if (!featuresByType[entityType]) {
      featuresByType[entityType] = [];
    }
    featuresByType[entityType].push(feature);
  }

  // 为每种类型创建单独的聚合源和图层
  for (const entityType in featuresByType) {
    // 跳过不显示的实体类型
    if (!entityInfo[entityType]?.show) continue;

    // 创建源
    const typeSource = new VectorSource({
      features: featuresByType[entityType],
    });

    // 创建聚合源
    const clusterSource = new Cluster({
      distance: 20,
      source: typeSource,
    });

    // 保存聚合源以便后续更新
    entityClusterSources[entityType] = clusterSource;

    // 创建图层
    const layer = new VectorLayer({
      source: clusterSource,
      style: feature => {
        const size = feature.get('features')?.length;
        // 如果只有一个点，使用原始样式
        if (!size || size === 1) {
          const baseScale = entityInfo[entityType]?.scale;
          return new Style({
            image: new Icon({
              src: `/assets/${entityInfo[entityType]?.point || 'default'}.png`,
              scale: getIconScaleForZoom(baseScale),
            }),
          });
        }

        // 否则使用同样的图标但添加数字标记
        const styleKey = `${entityType}-${size}-${currentZoomLevel}`;
        if (!styleCache[styleKey]) {
          const color = getColorForEntity(entityType);
          const baseRadius = 20;
          const radius = getCircleRadiusForZoom(baseRadius);

          // 这里创建样式数组而不是一个组合样式
          const styles = [
            // 半透明圆形背景
            new Style({
              image: new CircleStyle({
                radius: radius,
                fill: new Fill({
                  color: color,
                }),
                stroke: new Stroke({
                  color: '#fff',
                  width: 1,
                }),
              }),
            }),
            // 图标
            new Style({
              image: new Icon({
                src: `/assets/${
                  entityInfo[entityType]?.point || 'default'
                }.png`,
                scale: getIconScaleForZoom(entityInfo[entityType]?.scale),
              }),
            }),
            // 数字标记
            new Style({
              text: new Text({
                text: size.toString(),
                fill: new Fill({
                  color: '#fff',
                }),
                font: 'bold 12px Arial',
                offsetX: 8, // 向右偏移
                offsetY: 8, // 向下偏移
                stroke: new Stroke({
                  color: '#000',
                  width: 2,
                }),
              }),
            }),
          ];

          styleCache[styleKey] = styles;
        }

        // 从缓存返回样式数组
        return styleCache[styleKey];
      },
      zIndex: 10,
    });

    // 保存图层引用
    entityClusterLayers.push(layer);
  }

  return entityClusterLayers;
};

// 更新聚合距离的函数
export const updateClusterDistance = (zoom: number) => {
  // 在最大缩放级别(5)时完全禁用聚合
  const distance =
    zoom >= 4.5 ? 0 : zoom <= 2 ? 30 : zoom <= 3 ? 15 : zoom <= 4 ? 5 : 0;

  // 更新每个聚合源的距离
  Object.values(entityClusterSources).forEach(source => {
    source.setDistance(distance);
  });

  // 清除缓存的样式
  Object.keys(styleCache).forEach(key => delete styleCache[key]);
};

// 强制分散最大缩放级别的聚合点
export const forceDisperseAtMaxZoom = (zoom: number) => {
  if (zoom >= 5) {
    // 在最大缩放级别强制所有聚合源的距离为0
    Object.values(entityClusterSources).forEach(source => {
      source.setDistance(0);
    });
  }
};

// 实现刷新聚合函数
export const refreshCluster = () => {
  // 清空现有的聚合层
  entityClusterLayers.length = 0;
  Object.keys(entityClusterSources).forEach(
    key => delete entityClusterSources[key]
  );

  // 重新创建聚合层
  createEntityClusterLayers();

  // 重置当前缩放级别的聚合距离
  updateClusterDistance(currentZoomLevel);
  // 在最大缩放级别时强制禁用聚合
  if (currentZoomLevel >= 5) {
    forceDisperseAtMaxZoom(currentZoomLevel);
  }
};

// 修改refresh函数，更新图层的可见性
export const refresh = () => {
  for (const key in entityInfo) {
    // 获取该类型的聚合源
    const source = entityClusterSources[key];

    // 如果当前实体类型没有聚合源，跳过处理
    if (!source) continue;

    // 如果该类型的点位应该显示，但源可能是空的
    if (entityInfo[key].show) {
      // 重新添加源中的所有特征
      const featuresForType = features.filter(
        f => f.get('payload')?.entityDataIdKey === key
      );
      // 清除并重新添加特征以确保可见性
      const vectorSource = source.getSource();
      if (vectorSource) {
        vectorSource.clear();
        vectorSource.addFeatures(featuresForType);
      }
    } else {
      // 如果该类型不应该显示，清空源
      const vectorSource = source.getSource();
      if (vectorSource) {
        vectorSource.clear();
      }
    }
  }

  // 强制更新所有源的聚合
  Object.values(entityClusterSources).forEach(source => source.refresh());
};

export const select = (key: string) => {
  entityInfo[key].show = !entityInfo[key].show;
  // 调用修改后的refresh函数更新地图显示
  refresh();
};

export const selectAll = () => {
  for (const key in entityInfo) {
    entityInfo[key].show = true;
  }
  refresh();
};

export const clear = () => {
  for (const key in entityInfo) {
    entityInfo[key].show = false;
  }
  refresh();
};

export const isSelectAll = computed(() => {
  return Object.keys(entityInfo).every(key => entityInfo[key].show);
});

export const clusterSource = new Cluster({
  distance: 1,
  source: new VectorSource(),
});

createEntityClusterLayers();
