import { xyz2crd } from '../utils/common';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Text, Fill, Stroke } from 'ol/style';

import locations from '../assets/result.json';
import { getLanguage } from '@/i18n';

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
  'en-US': 1,
  'ja-JP': 2,
  'ko-KR': 3,
  'zh-TW': 4,
};

export const loadTextPoints = (
  reset = false,
  scene = 'map01',
  zoom: number
) => {
  const detail = zoom >= 3.5 || scene === 'map02';
  const styleFn = (text: string) =>
    new Style({
      text: new Text({
        text,
        font: 'bold 1.5rem "Noto Sans SC", sans-serif',
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
    vectorSource.clear();
  }
  const lang = getLanguage();
  // console.log('select lang', lang)
  for (const k of Object.keys(locations).filter(
    key => locations[key].priority == (detail ? 'Override' : 'Base')
  )) {
    const loc = locations[k].subTitle;

    if (cacheKey?.[loc.key]) continue;
    cacheKey[loc.key] = true;

    if (!loc?.position || !locations[k].map?.includes(scene)) continue;
    const text = loc.langs[selectLang[lang]];

    const feature = new Feature({ geometry: new Point(xyz2crd(loc.position)) });
    feature.setStyle(styleFn(text));
    // 设置Z索引，确保在移动时仍然优先渲染
    feature.set('zIndex', 1000);
    // 添加标识属性，便于识别此Feature是文本标签
    feature.set('isTextLabel', true);
    vectorSource.addFeature(feature);
  }
};
