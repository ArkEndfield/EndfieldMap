import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ELECTRIC_POLE_DEVICE_KEY,
  ELECTRIC_POLE_DEVICE_CONFIGS,
  ELECTRIC_RANGE_BASE_METERS,
  getElectricPoleDeviceConfig,
  isElectricPoleDeviceAvailableOnMap,
  isSameElectricPoleConnectionType,
  LEGACY_ELECTRIC_POLE_DEVICE_KEY,
} from './electric_pole';

describe('electric_pole constants', () => {
  it('exposes expected defaults and device configs', () => {
    expect(ELECTRIC_RANGE_BASE_METERS).toBe(80);
    expect(DEFAULT_ELECTRIC_POLE_DEVICE_KEY).toBe('pole');
    expect(LEGACY_ELECTRIC_POLE_DEVICE_KEY).toBe('repeater');
    expect(Object.keys(ELECTRIC_POLE_DEVICE_CONFIGS)).toEqual([
      'pole',
      'repeater',
      'zipline_80',
      'zipline_110',
      'pipe',
    ]);
  });

  it('returns device config by key', () => {
    expect(getElectricPoleDeviceConfig('pole')).toMatchObject({
      key: 'pole',
      iconPic: 'item_port_power_diffuser_1',
      rangeMeters: 30,
      connectionType: 'electric',
      maxConnections: 10,
    });
    expect(getElectricPoleDeviceConfig('zipline_110')).toMatchObject({
      key: 'zipline_110',
      iconPic: 'item_port_travel_pole_2',
      rangeMeters: 110,
      connectionType: 'zipline',
      maxConnections: false,
    });
    expect(getElectricPoleDeviceConfig('pipe')).toMatchObject({
      key: 'pipe',
      iconPic: 'item_port_udpipe_loader_1',
      rangeMeters: 300,
      connectionType: 'pipe',
      maxConnections: false,
      availableMapIds: ['map02'],
    });
  });

  it('compares connection compatibility by connection type', () => {
    expect(isSameElectricPoleConnectionType('pole', 'repeater')).toBe(true);
    expect(isSameElectricPoleConnectionType('zipline_80', 'zipline_110')).toBe(true);
    expect(isSameElectricPoleConnectionType('pole', 'zipline_80')).toBe(false);
    expect(isSameElectricPoleConnectionType('pipe', 'pipe')).toBe(true);
    expect(isSameElectricPoleConnectionType('pipe', 'pole')).toBe(false);
    expect(isSameElectricPoleConnectionType('pipe', 'zipline_80')).toBe(false);
  });

  it('limits device availability by map id', () => {
    expect(isElectricPoleDeviceAvailableOnMap('pole', 'map01')).toBe(true);
    expect(isElectricPoleDeviceAvailableOnMap('pole', 'map02')).toBe(true);
    expect(isElectricPoleDeviceAvailableOnMap('pipe', 'map02')).toBe(true);
    expect(isElectricPoleDeviceAvailableOnMap('pipe', 'map01')).toBe(false);
  });
});
