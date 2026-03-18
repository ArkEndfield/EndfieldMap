import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ELECTRIC_POLE_DEVICE_KEY,
  ELECTRIC_POLE_DEVICE_CONFIGS,
  ELECTRIC_RANGE_BASE_METERS,
  LEGACY_ELECTRIC_POLE_DEVICE_KEY,
  getElectricPoleDeviceConfig,
  isSameElectricPoleConnectionType,
} from './electric_pole';

describe('electric_pole constants', () => {
  it('exposes expected defaults and device configs', () => {
    expect(ELECTRIC_RANGE_BASE_METERS).toBe(80);
    expect(DEFAULT_ELECTRIC_POLE_DEVICE_KEY).toBe('pole');
    expect(LEGACY_ELECTRIC_POLE_DEVICE_KEY).toBe('repeater');
    expect(Object.keys(ELECTRIC_POLE_DEVICE_CONFIGS)).toEqual(['pole', 'repeater', 'zipline_80', 'zipline_110']);
  });

  it('returns device config by key', () => {
    expect(getElectricPoleDeviceConfig('pole')).toMatchObject({
      key: 'pole',
      iconPic: 'electric_pole',
      rangeMeters: 30,
      connectionType: 'electric',
      maxConnections: 10,
    });
    expect(getElectricPoleDeviceConfig('zipline_110')).toMatchObject({
      key: 'zipline_110',
      iconPic: 'electric_slider_110',
      rangeMeters: 110,
      connectionType: 'zipline',
      maxConnections: false,
    });
  });

  it('compares connection compatibility by connection type', () => {
    expect(isSameElectricPoleConnectionType('pole', 'repeater')).toBe(true);
    expect(isSameElectricPoleConnectionType('zipline_80', 'zipline_110')).toBe(true);
    expect(isSameElectricPoleConnectionType('pole', 'zipline_80')).toBe(false);
  });
});
