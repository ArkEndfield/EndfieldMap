import type { EntityData } from '@endfieldmap/map-core';
import type { GuideInfo } from '@endfieldmap/map-service';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { service } from '@/services/map-service';

import { Guide } from '../guide';

jest.mock('@/services/map-service', () => ({
  service: {
    dataService: {
      guideDataService: { getGuide: jest.fn() },
    },
  },
}));

const getGuide = jest.mocked(service.dataService.guideDataService.getGuide);

const entity = { levelLogicId: 3 } as EntityData;

// 实测 GET /api/v1/guides/:id 的形状（扁平 GuideInfo，见 round6 契约排查）。
const flatGuide: GuideInfo = {
  record_id: 'reckhhE2TpTDUx0BkOq',
  internal_id: 10100023120,
  area: '景玉谷',
  marker_type: '醚质',
  description: '基础收集物',
  images: ['data:image/png;base64,AAA', 'data:image/png;base64,BBB'],
  video_links: null,
  layer_map: '',
  visible: '否',
  progress: '未开始',
  refreshable: '否',
};

beforeEach(() => {
  getGuide.mockReset();
});

describe('Guide', () => {
  it('renders description and images from the flat GuideInfo shape', async () => {
    getGuide.mockResolvedValue(flatGuide);

    await render(<Guide entity={entity} />);

    await waitFor(() => expect(screen.getByText('基础收集物')).toBeTruthy());
    expect(getGuide).toHaveBeenCalledWith(3);
    // Image 的 A11y 角色是 image。
  });

  it('renders nothing when the guide has no description and no images', async () => {
    getGuide.mockResolvedValue({ ...flatGuide, description: '', images: null });

    await render(<Guide entity={entity} />);

    await waitFor(() => expect(getGuide).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('景玉谷')).toBeNull());
    expect(screen.queryAllByRole('image').length).toBe(0);
  });

  it('renders nothing while the fetch resolves null', async () => {
    getGuide.mockResolvedValue(null);

    await render(<Guide entity={entity} />);

    await waitFor(() => expect(getGuide).toHaveBeenCalled());
    expect(screen.queryAllByRole('image').length).toBe(0);
  });

  it('refetches when the entity changes', async () => {
    getGuide.mockResolvedValue(flatGuide);

    const { rerender } = await render(<Guide entity={entity} />);
    await waitFor(() => expect(getGuide).toHaveBeenCalledTimes(1));

    const other = { levelLogicId: 7 } as EntityData;
    await rerender(<Guide entity={other} />);
    await waitFor(() => expect(getGuide).toHaveBeenCalledTimes(2));
    expect(getGuide).toHaveBeenLastCalledWith(7);
    await waitFor(() => expect(screen.getByText('基础收集物')).toBeTruthy());
  });
});
