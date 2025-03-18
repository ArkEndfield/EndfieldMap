import { xyz2crd } from "@/utils/common";
import { Feature } from "ol";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import { Icon, Style } from "ol/style";
import { reactive } from "vue";

// @ts-ignore
import points from '../assets/output.json';

// 菜单信息
export const entityInfo = reactive({
    int_trchest_common: { name: '储藏箱I', point: 'int_trchest_common', show: true, count: 0 },
    int_trchest_common_normal: { name: '储藏箱II', point: 'int_trchest_common', show: true, count: 0 },
    int_trchest_common_high: { name: '储藏箱III', point: 'int_trchest_common', show: true, count: 0 },
    int_trchest_lock: { name: '储藏箱IV', point: 'int_trchest_common', show: true, count: 0 },
    // int_collection_common: { name: '采集', point: 'default', show: true, count: 0  },
    // int_module_chasingrabbit: { name: '追兔头', point: 'default', show: true },
    int_campfire_v2: { name: '传送点', point: 'int_campfire_v2', show: true, count: 0 },
    // int_narrative_common: { name: '纸条', point: 'item_read_note', show: true, scale: 0.15 },
    // int_narrative_common_empty: { name: '字幕', show: true },
    int_blackbox_entry: { name: '普通修理', point: 'icon_map_blackbox', show: true, scale: 0.7, count: 0 },
    int_blackbox_entry_hard: { name: '突袭修理', point: 'icon_map_blackbox', show: true, scale: 0.7, count: 0 },
    int_dungeon_entry_challenge: { name: '挑战副本', point: 'icon_map_dungeon', show: true, scale: 0.7, count: 0 },
    int_dungeon_entry_resource: { name: '材料副本', point: 'icon_map_dungeon', show: true, scale: 0.7, count: 0 },
    int_collection_coin: { name: '醚质', point: 'item_colllection_ether', show: true, scale: 0.2, count: 0 },
    int_collection_coin_puzzle: { name: '突袭醚质', point: 'item_colllection_ether', show: true, scale: 0.2, count: 0 },
})
// export const entityInfo = {
//     int_trchest_common_high: { name: '玛恩纳储藏箱', point: 'int_trchest_common', pass: false },
//     int_trchest_common: { name: '储藏箱', point: 'int_trchest_common', pass: false},
//     int_trchest_common_normal: { name: '水陈储藏箱', point: 'int_trchest_common', pass: false },
//     int_trchest_lock: { name: '锁闭储藏箱', point: 'int_trchest_common', pass: false },
//     int_collection_common: { name: '采集', point: 'default', pass: true },
//     int_module_chasingrabbit: { name: '追兔头', point: 'default', pass: true },
//     int_campfire_v2: { name: '协议传送点', point: 'int_campfire_v2', pass: false },
//     int_narrative_common: { name: '纸条', point: 'item_read_note', pass: true, scale: 0.15 },
//     int_narrative_common_empty: { name: '字幕', pass: true },
//     int_blackbox_entry: { name: '故障机器人', point: 'icon_map_blackbox', pass: false, scale: 0.7 },
//     int_blackbox_entry_hard: { name: '高难故障机器人', point: 'icon_map_blackbox', pass: false, scale: 0.7 },
//     int_dungeon_entry_challenge: { name: '神秘副本', point: 'icon_map_dungeon', pass: false, scale: 0.7 },
//     int_dungeon_entry_resource: { name: '神秘副本', point: 'icon_map_dungeon', pass: false, scale: 0.7 },
//     int_collection_coin: { name: '站桩醚质', point: 'item_colllection_ether', pass: false, scale: 0.2 },
//     int_collection_coin_puzzle: { name: '并非站桩醚质', point: 'item_colllection_ether', pass: false, scale: 0.2 },
// }

let index = 1;
const features: Feature<Point>[] = [];
const itemMap: any = {};
const entityGroup: Record<string, {
    name: string
    points: Feature<Point>[]
}> = {}

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
        scale: entityInfo[entry.entityDataIdKey]?.scale,
      }),
    })
  );
  if (!entityGroup[entry.entityDataIdKey]?.points?.length) {
    entityGroup[entry.entityDataIdKey] = {
        name: info.name,
        points: [feature]
    }
  } else {
    entityGroup[entry.entityDataIdKey].points.push(feature)
    entityInfo[entry.entityDataIdKey].count += 1
  }
  return feature;
};

export interface entityData {
    sceneId: string,
    seq: number,
    position: {
        x: number,
        y: number,
        z: number
    },
    entityDataIdKey: string,
    properties?: any[]
}

for (const m in points) {
  if (!m.includes('map01')) continue;
  for (const point of points[m]) {
    itemMap[point.entityDataIdKey] = (itemMap[point.entityDataIdKey] || 0) + 1;
    const feature = marker(point);
    if (feature) features.push(feature);
  }
}

console.log('醚质总数:', features.length, itemMap);

export const source = new VectorSource({
  features: features,
})

export const refresh = () => {
    source.clear(true)
    // 检查 entityInfo 关闭情况
    const list = Object.keys(entityInfo).filter(key => entityInfo[key].show);
    const newPoints = list.reduce((acc: Feature<Point>[], key) => {
        if (entityGroup[key]?.points) {
            acc.push(...entityGroup[key].points);
        }
        return acc;
    }, []);
    console.log(newPoints)
    source.addFeatures(newPoints)
}