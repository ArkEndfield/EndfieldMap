import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useAdapter } from '@/context/adapter-context';
import { service } from '@/services/map-service';

import { EntityInfoSheet } from '../entity-info-sheet';

jest.mock('@/services/map-service', () => ({
  service: {
    langHashService: { getHash: jest.fn() },
    dataService: { mapDataService: { moveToEntityInstance: jest.fn() } },
  },
}));
jest.mock('@/context/adapter-context', () => ({ useAdapter: jest.fn() }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
  }),
}));
jest.mock('@lodev09/react-native-true-sheet', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    TrueSheet: React.forwardRef((props: { children?: React.ReactNode }, _ref: unknown) =>
      React.createElement(View, { testID: 'true-sheet' }, props.children),
    ),
  };
});
jest.mock('mobx-react-lite', () => ({ observer: (x: unknown) => x }));

const moveToEntityInstance = jest.mocked(service.dataService.mapDataService.moveToEntityInstance);
const getHash = jest.mocked(service.langHashService.getHash);
const setMarked = jest.fn();
const clearActiveFeature = jest.fn();
const mockAdapter = {
  asset: { entityImage: 'https://img.example.com' },
  entityController: { setMarked },
  activeFeatureController: { clearActiveFeature },
};
const mockedUseAdapter = jest.mocked(useAdapter);

// 常规实体实例（非电线杆/自定义标点分支）。
const instance = {
  id: 'ent-1',
  entityType: 'Normal',
  mapId: 'map-a',
  name: 'Raw Entity Name',
  marked: false,
  markable: true,
  position: { x: 1.234, z: 5.678 },
  entityInfo: { category: 'normal', entityInfo: { pic: 'pic01', point: 'POINT_HASH' } },
} as never;

beforeEach(() => {
  moveToEntityInstance.mockReset();
  setMarked.mockReset();
  clearActiveFeature.mockReset();
  getHash.mockReset().mockReturnValue('hash-1');
  mockedUseAdapter.mockReset().mockReturnValue(mockAdapter as never);
});

describe('EntityInfoSheet', () => {
  it('renders id and coordinates for a normal entity', async () => {
    await render(<EntityInfoSheet instance={instance} onDismiss={jest.fn()} />);

    // 模板串 `categoryName · ID: {instance.id}` 分段成多个文本节点，
    // 断言落在 id 与坐标两个完整节点上。
    await waitFor(() => expect(screen.getByText('POINT_HASH')).toBeTruthy());
    // ID 段与分类同处一个混合文本节点，用包含匹配。
    expect(screen.getByText(/ID: ent-1/)).toBeTruthy();
    expect(screen.getByText('(1.2, 5.7)')).toBeTruthy();
    expect(screen.getByText('定位')).toBeTruthy();
  });

  it('locates via MapDataService.moveToEntityInstance on press', async () => {
    await render(<EntityInfoSheet instance={instance} onDismiss={jest.fn()} />);

    fireEvent.press(screen.getByText('定位'));
    expect(moveToEntityInstance).toHaveBeenCalledTimes(1);
    expect(moveToEntityInstance).toHaveBeenCalledWith(instance, true, true, 800);
  });

  it('marks an unmarked entity through the entity controller', async () => {
    await render(<EntityInfoSheet instance={instance} onDismiss={jest.fn()} />);

    fireEvent.press(screen.getByText('标记完成'));
    expect(setMarked).toHaveBeenCalledWith('map-a', 'ent-1', true);
  });

  it('renders an empty stub when no instance is selected', async () => {
    await render(<EntityInfoSheet instance={null} onDismiss={jest.fn()} />);
    expect(screen.queryByText('定位')).toBeNull();
  });
});
