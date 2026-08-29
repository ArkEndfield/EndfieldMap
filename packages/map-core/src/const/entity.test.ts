import { ElectricPoleIdKey, ElectricPoleKey } from '@endfieldmap/map-core/const/map';
import { describe, expect, it } from 'vitest';

import { electricPoleEntityInfo } from './entity';

describe('entity constants', () => {
  it('defines electric pole entity info', () => {
    expect(electricPoleEntityInfo).toEqual({
      category: ElectricPoleKey,
      entityInfo: {
        pic: 'icon_map_big_pole',
        point: ElectricPoleIdKey,
      },
    });
  });
});
