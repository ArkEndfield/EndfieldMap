import { xyz2crd } from "../utils/common";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Text, Fill, Stroke } from "ol/style";

const locations = [
  { textId: "scene_map02_lv001_sub01_location_tips_1",  name: "拂蓑林",  position: {"x": 175.35999, "y": 0.0, "z": -605.8667} },
  { textId: "scene_map02_lv001_sub01_location_tips_2",  name: "厝剑浦",  position: {"x": 142.71997, "y": 0.0, "z": -454.61334} },
  { textId: "scene_map02_lv001_sub01_location_tips_3",  name: "厝剑渡",  position: {"x": 0.0, "y": 0.0, "z": -442.45334} },
  { textId: "scene_map02_lv001_sub06_location_tips_1",  name: "石圩村",  position: {"x": 144.64001, "y": 0.0, "z": -318.71997} },
  { textId: "scene_map02_lv001_sub02_location_tips_1",  name: "横津村",  position: {"x": -223.78665, "y": 0.0, "z": -59.946655} },
  { textId: "scene_map02_lv001_sub02_location_tips_2",  name: "藏云岫",  position: {"x": -396.8, "y": 0.0, "z": -60.58667} },
  { textId: "scene_map02_lv001_sub08_location_tips_1",  name: "渔笛荡",  position: {"x": -47.786682, "y": 0.0, "z": -543.14667} },
  { textId: "scene_map02_lv001_sub08_location_tips_2",  name: "净踪林",  position: {"x": -3.41333, "y": 0.0, "z": -674.3467} },
  { textId: "scene_map02_lv001_sub08_location_tips_3",  name: "净踪渡",  position: {"x": -160.42667, "y": 0.0, "z": -561.792} },
  { textId: "scene_map02_lv001_sub07_location_tips_1",  name: "屿东渡",  position: {"x": -68.90668, "y": 0.0, "z": -424.96} },
  { textId: "scene_map02_lv001_sub07_location_tips_2",  name: "屿西渡",  position: {"x": -215.68, "y": 0.0, "z": -450.45334} },
  { textId: "scene_map02_lv001_sub07_location_tips_3",  name: "萍屿",  position: {"x": -121.17334, "y": 0.0, "z": -454.82666} },
  { textId: "scene_map02_lv001_sub07_location_tips_4",  name: "摘菱屿",  position: {"x": -294.18668, "y": 0.0, "z": -473.6} },
  { textId: "scene_map02_lv001_sub07_location_tips_5",  name: "环境监测站",  position: {"x": -158.29333, "y": 0.0, "z": -318.93335} },
  { textId: "scene_map02_lv001_sub04_location_tips_1",  name: "后山小径",  position: {"x": -407.46667, "y": 0.0, "z": -237.65332} },
  { textId: "scene_map01_lv001_sub01_location_tips_3",  name: "集成核心区域",  position: {"x": 91.30664, "y": 0.0, "z": -264.53333} }
]

const vectorSource = new VectorSource();

export const areaNameLayer = new VectorLayer({
  source: vectorSource,
});

locations.forEach((location) => {
  const feature = new Feature({
    geometry: new Point(xyz2crd(location.position)),
  });

  // 动态设置文字内容
  feature.setStyle(
    new Style({
      text: new Text({
        text: location.name,
        font: '1.5rem sans-serif',
        fill: new Fill({ color: '#fff' }),
        stroke: new Stroke({ color: '#000', width: 2 }),
      }),
    })
  );
  vectorSource.addFeature(feature);
});