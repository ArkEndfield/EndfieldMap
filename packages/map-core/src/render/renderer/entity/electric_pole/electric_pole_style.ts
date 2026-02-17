import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';

/**
 * 电线杆连线样式
 * 仅保留连线样式（实体点层已迁移到 WebGL FlatStyle）
 */

/** 连线普通样式 */
export const CONNECTION_STYLE_NORMAL = new Style({
  stroke: new Stroke({ color: '#FFD700', width: 2 }),
});

/** 连线hover样式 */
export const CONNECTION_STYLE_HOVER = new Style({
  stroke: new Stroke({ color: '#FFA500', width: 4 }),
});
