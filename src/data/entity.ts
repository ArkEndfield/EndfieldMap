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

interface EntityInfo {
  name: string;
  point: string;
  show: boolean;
  count: number;
  scale?: number;
}

type EntityCategory =
  | 'ether' // 醚质
  | 'chest' // 宝箱
  | 'mineral' // 矿物
  | 'enemy' // 敌人
  | 'settlement' // 定居点
  | 'spcstone' // 稀有矿物
  | 'special' // 特殊点位
  | 'plant' // 植物类素材
  | 'dungeon'; // 副本点位

type EntityCategories = Record<
  string,
  {
    category: EntityCategory;
    entityInfo: EntityInfo;
  }
>;

export const entityInfo: EntityCategories = reactive({
  int_collection_coin: {
    category: 'ether',
    entityInfo: {
      name: '醚质',
      point: 'item_colllection_ether',
      show: true,
      scale: 0.2,
      count: 1,
    },
  },
  int_collection_coin_puzzle: {
    category: 'ether',
    entityInfo: {
      name: '突袭醚质',
      point: 'item_colllection_ether',
      show: true,
      scale: 0.2,
      count: 1,
    },
  },
  int_trchest_common: {
    category: 'chest',
    entityInfo: {
      name: '储藏箱I',
      point: 'int_trchest_common',
      show: true,
      count: 1,
    },
  },
  int_trchest_common_normal: {
    category: 'chest',
    entityInfo: {
      name: '储藏箱II',
      point: 'int_trchest_common_normal',
      show: true,
      count: 1,
    },
  },
  int_trchest_common_high: {
    category: 'chest',
    entityInfo: {
      name: '储藏箱III',
      point: 'int_trchest_common_high',
      show: true,
      count: 1,
    },
  },
  int_trchest_lock: {
    category: 'chest',
    entityInfo: {
      name: '储藏箱IV',
      point: 'int_trchest_lock',
      show: true,
      count: 1,
    },
  },

  int_campfire_v2: {
    category: 'special',
    entityInfo: {
      name: '传送点',
      point: 'int_campfire_v2',
      show: true,
      count: 1,
    },
  },
  int_blackbox_entry: {
    category: 'special',
    entityInfo: {
      name: '普通修理',
      point: 'icon_map_blackbox',
      show: true,
      scale: 0.7,
      count: 1,
    },
  },
  int_blackbox_entry_hard: {
    category: 'special',
    entityInfo: {
      name: '突袭修理',
      point: 'icon_map_blackbox',
      show: true,
      scale: 0.7,
      count: 1,
    },
  },

  int_dungeon_entry_bossrush: {
    category: 'dungeon',
    entityInfo: {
      name: '首领挑战',
      point: 'icon_map_dungeon',
      show: true,
      scale: 0.7,
      count: 1,
    },
  },
  int_dungeon_entry_challenge: {
    category: 'dungeon',
    entityInfo: {
      name: '挑战副本',
      point: 'icon_map_dungeon',
      show: true,
      scale: 0.7,
      count: 1,
    },
  },
  int_dungeon_entry_hard: {
    category: 'dungeon',
    entityInfo: {
      name: '突袭副本',
      point: 'icon_map_dungeon',
      show: true,
      scale: 0.7,
      count: 1,
    },
  },
  int_dungeon_entry_resource: {
    category: 'dungeon',
    entityInfo: {
      name: '材料副本',
      point: 'icon_map_dungeon',
      show: true,
      scale: 0.7,
      count: 1,
    },
  },

  int_doodad_core_mine_copper: {
    category: 'mineral',
    entityInfo: {
      name: '赤铜矿脉',
      point: 'int_doodad_core_mine_copper',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_mine_iron: {
    category: 'mineral',
    entityInfo: {
      name: '蓝铁矿脉',
      point: 'int_doodad_core_mine_iron',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_mine_originum: {
    category: 'mineral',
    entityInfo: {
      name: '源矿矿脉',
      point: 'int_doodad_core_mine_originum',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_mine_quartz: {
    category: 'mineral',
    entityInfo: {
      name: '紫晶矿脉',
      point: 'int_doodad_core_mine_quartz',
      show: true,
      count: 1,
    },
  },

  int_doodad_core_crylplant_1_1: {
    category: 'plant',
    entityInfo: {
      name: '晶化多齿叶',
      point: 'int_doodad_core_crylplant_1_1',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_crylplant_1_2: {
    category: 'plant',
    entityInfo: {
      name: '纯晶多齿叶',
      point: 'int_doodad_core_crylplant_1_2',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_crylplant_1_3: {
    category: 'plant',
    entityInfo: {
      name: '至晶多齿叶',
      point: 'int_doodad_core_crylplant_1_3',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_crylplant_2_1: {
    category: 'plant',
    entityInfo: {
      name: '受蚀玉化叶',
      point: 'int_doodad_core_crylplant_2_1',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_mushroom_1_1: {
    category: 'plant',
    entityInfo: {
      name: '轻红柱状菌',
      point: 'int_doodad_core_mushroom_1_1',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_mushroom_1_2: {
    category: 'plant',
    entityInfo: {
      name: '中红柱状菌',
      point: 'int_doodad_core_mushroom_1_2',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_mushroom_1_3: {
    category: 'plant',
    entityInfo: {
      name: '重红柱状菌',
      point: 'int_doodad_core_mushroom_1_3',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_mushroom_2_1: {
    category: 'plant',
    entityInfo: {
      name: '血菌',
      point: 'int_doodad_core_mushroom_2_1',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_plant_rabbithole: {
    category: 'plant',
    entityInfo: {
      name: '稀有采集物区',
      point: 'int_doodad_core_plant_rabbithole',
      show: true,
      count: 1,
    },
  },

  int_doodad_core_spcstone: {
    category: 'spcstone',
    entityInfo: {
      name: '稀有矿物区',
      point: 'int_doodad_core_spcstone',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_spcstone_1_1: {
    category: 'spcstone',
    entityInfo: {
      name: '轻黯石',
      point: 'int_doodad_core_spcstone_1_1',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_spcstone_1_2: {
    category: 'spcstone',
    entityInfo: {
      name: '中黯石',
      point: 'int_doodad_core_spcstone_1_2',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_spcstone_1_3: {
    category: 'spcstone',
    entityInfo: {
      name: '重黯石',
      point: 'int_doodad_core_spcstone_1_3',
      show: true,
      count: 1,
    },
  },
  int_doodad_core_spcstone_2_1: {
    category: 'spcstone',
    entityInfo: {
      name: '燎石',
      point: 'int_doodad_core_spcstone_2_1',
      show: true,
      count: 1,
    },
  },

  int_doodad_core_recycle: {
    category: 'special',
    entityInfo: {
      name: '资源回收站',
      point: 'int_doodad_core_recycle',
      show: true,
      count: 1,
    },
  },
  int_bamboo_raft: {
    category: 'special',
    entityInfo: {
      name: '竹筏',
      point: 'int_bamboo_raft',
      show: true,
      count: 1,
    },
  },
  int_challenge_start_point_once: {
    category: 'special',
    entityInfo: {
      name: '处理险情',
      point: 'int_challenge_start_point_once',
      show: true,
      count: 1,
    },
  },
  int_challenge_start_point: {
    category: 'special',
    entityInfo: {
      name: '处理险情',
      point: 'int_challenge_start_point',
      show: true,
      count: 1,
    },
  },
  int_collection_piece: {
    category: 'special',
    entityInfo: {
      name: '维修灵感',
      point: 'int_collection_piece',
      show: true,
      count: 1,
    },
  },
  int_collection_piece_in_door: {
    category: 'special',
    entityInfo: {
      name: '维修灵感',
      point: 'int_collection_piece_in_door',
      show: true,
      count: 1,
    },
  },
  int_curve_move_platform: {
    category: 'special',
    entityInfo: {
      name: '呼叫竹筏',
      point: 'int_curve_move_platform',
      show: true,
      count: 1,
    },
  },

  stm_hongs_1: {
    category: 'settlement',
    entityInfo: {
      name: '武陵联合科考基地',
      point: 'stm_hongs_1',
      show: true,
      count: 1,
    },
  },
  stm_tundra_1: {
    category: 'settlement',
    entityInfo: {
      name: '谷地难民定居地',
      point: 'stm_tundra_1',
      show: true,
      count: 1,
    },
  },
  stm_tundra_2: {
    category: 'settlement',
    entityInfo: {
      name: '工团基础建设前站',
      point: 'stm_tundra_2',
      show: true,
      count: 1,
    },
  },
  stm_tundra_3: {
    category: 'settlement',
    entityInfo: {
      name: '高地灾后恢复前哨',
      point: 'stm_tundra_3',
      show: true,
      count: 1,
    },
  },

  eny_0045_agtrinit: {
    category: 'enemy',
    entityInfo: {
      name: '三位一体',
      point: 'eny_0045_agtrinit',
      show: true,
      count: 1,
    },
  },
});

export const categoryInfo = computed(() => {
  const categories: Record<string, EntityInfo[]> = {};
  for (const key in entityInfo) {
    const entity = entityInfo[key];
    const category = entity.category;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(entity.entityInfo);
  }
  return categories;
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
  if (!info || !info?.entityInfo.show) return;

  const feature = new Feature({
    geometry: new Point(xyz2crd(entry.position)),
    payload: entry,
  });
  feature.setStyle(
    new Style({
      image: new Icon({
        src: `/assets/${
          entityInfo[entry.entityDataIdKey]?.entityInfo.point || 'default'
        }.png`,
        scale: getIconScaleForZoom(
          entityInfo[entry.entityDataIdKey]?.entityInfo.scale
        ),
      }),
    })
  );
  if (!entityGroup[entry.entityDataIdKey]?.points?.length) {
    entityGroup[entry.entityDataIdKey] = {
      name: info.entityInfo.name,
      points: [feature],
    };
  } else {
    entityGroup[entry.entityDataIdKey].points.push(feature);
    entityInfo[entry.entityDataIdKey].entityInfo.count += 1;
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
    if (!entityInfo[entityType]?.entityInfo.show) continue;

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
          const baseScale = entityInfo[entityType]?.entityInfo.scale;
          return new Style({
            image: new Icon({
              src: `/assets/${
                entityInfo[entityType]?.entityInfo.point || 'default'
              }.png`,
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
                  entityInfo[entityType]?.entityInfo.point || 'default'
                }.png`,
                scale: getIconScaleForZoom(
                  entityInfo[entityType]?.entityInfo.scale
                ),
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
    if (entityInfo[key].entityInfo.show) {
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
  entityInfo[key].entityInfo.show = !entityInfo[key].entityInfo.show;
  // 调用修改后的refresh函数更新地图显示
  refresh();
};

export const selectAll = () => {
  for (const key in entityInfo) {
    entityInfo[key].entityInfo.show = true;
  }
  refresh();
};

export const toggleSelect = (key: string) => {
  entityInfo[key].entityInfo.show = !entityInfo[key].entityInfo.show;
  refresh();
};

export const toggleSelectByName = (name: string) => {
  for (const key in entityInfo) {
    if (entityInfo[key].entityInfo.name === name) {
      entityInfo[key].entityInfo.show = !entityInfo[key].entityInfo.show;
    }
  }
  refresh();
};

export const clear = () => {
  for (const key in entityInfo) {
    entityInfo[key].entityInfo.show = false;
  }
  refresh();
};

export const isSelectAll = computed(() => {
  return Object.keys(entityInfo).every(key => entityInfo[key].entityInfo.show);
});

export const clusterSource = new Cluster({
  distance: 1,
  source: new VectorSource(),
});

createEntityClusterLayers();
