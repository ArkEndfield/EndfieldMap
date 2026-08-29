import { CustomPointKey } from '@endfieldmap/map-core/const/map';
import { describe, expect, it } from 'vitest';

import {
  customPointTypeMap,
  customPointTypes,
  getCustomPointEntityInfo,
  getDefaultCustomPointEntityInfo,
  getDefaultCustomPointType,
  isValidCustomPointType,
} from './custom_point_config';

describe('custom_point_config', () => {
  it('defines the expected custom point type map and list', () => {
    expect(Object.keys(customPointTypeMap)).toHaveLength(7);
    expect(customPointTypes).toHaveLength(7);
    expect(customPointTypes[0]).toEqual({
      id: 'custom_point_1',
      icon: 'icon_map_custom_mark_shadow_1',
    });
  });

  it('builds entity info from a custom point type', () => {
    expect(getCustomPointEntityInfo('custom_point_3')).toEqual({
      category: CustomPointKey,
      entityInfo: {
        point: 'custom_point_3',
        pic: 'icon_map_custom_mark_shadow_3',
      },
    });
  });

  it('returns default type info and validates type ids', () => {
    expect(getDefaultCustomPointType()).toEqual({
      id: 'custom_point_1',
      icon: 'icon_map_custom_mark_shadow_1',
    });
    expect(getDefaultCustomPointEntityInfo()).toEqual(getCustomPointEntityInfo('custom_point_1'));
    expect(isValidCustomPointType('custom_point_7')).toBe(true);
    expect(isValidCustomPointType('custom_point_99')).toBe(false);
  });
});
