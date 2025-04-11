import { xyz2crd } from '../utils/common';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Text, Fill, Stroke } from 'ol/style';

import locations from '../assets/result.json';
import { getLanguage } from '@/i18n';
import { LOCAL_STORAGE_KEY } from '@/constants/db_key';

const vectorSource = new VectorSource();

export const areaNameLayer = new VectorLayer({
  source: vectorSource,
  zIndex: 9,
  // 添加以下属性以确保移动时标签不会消失
  renderBuffer: 200,
  updateWhileAnimating: true,
  updateWhileInteracting: true,
});

const selectLang = {
  'zh-CN': 0,
  'zh-TW': 4,
  'en-US': 1,
};

export const loadTextPoints = (reset = false, scene = 'map01') => {
  const detail =
    Number(localStorage.getItem(LOCAL_STORAGE_KEY.ZOOM)) >= 3.5 ||
    scene === 'map02';
  const styleFn = (text: string) =>
    new Style({
      text: new Text({
        text,
        font: '1.5rem "Noto Sans SC"',
        fill: new Fill({ color: '#fff' }),
        stroke: new Stroke({ color: '#000', width: 2 }),
        padding: [5, 10, 5, 10],
        offsetY: -15,
      }),
    });

  const cacheKey = {};
  // console.log(detail);

  if (reset) {
    // 增强清理过程
    const features = vectorSource.getFeatures();

    // 确保从源中移除所有特征，同时清理引用
    if (features.length > 0) {
      // 手动移除每个特征，确保完全清理
      features.forEach(feature => {
        // 从源中移除
        vectorSource.removeFeature(feature);
      });

      // console.log(`已清理 ${features.length} 个地名标签`);
    }

    // 最后确保源是空的
    vectorSource.clear();
  }

  for (const k of Object.keys(locations).filter(
    key => locations[key].priority == (detail ? 'Override' : 'Base')
  )) {
    const loc = locations[k].subTitle;

    if (cacheKey?.[loc.key]) continue;
    cacheKey[loc.key] = true;

    if (!loc?.position || !locations[k].map?.includes(scene)) continue;
    const text = loc.langs[selectLang[getLanguage()]];

    const feature = new Feature({ geometry: new Point(xyz2crd(loc.position)) });
    feature.setStyle(styleFn(text));
    // 设置Z索引，确保在移动时仍然优先渲染
    feature.set('zIndex', 1000);
    // 添加标识属性，便于识别此Feature是文本标签
    feature.set('isTextLabel', true);
    vectorSource.addFeature(feature);
  }
};
