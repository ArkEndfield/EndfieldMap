import { Tooltip } from '@endfieldmap/web-components/components/tooltip/index';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip tooltip="This is a tooltip">
      <span style={{ padding: '8px 16px', border: '1px solid #ccc', cursor: 'pointer' }}>Hover me</span>
    </Tooltip>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', padding: 80 }}>
      {(['top', 'bottom', 'left', 'right'] as const).map((placement) => (
        <Tooltip key={placement} tooltip={`Placement: ${placement}`} placement={placement}>
          <span style={{ padding: '8px 16px', border: '1px solid #ccc', cursor: 'pointer' }}>{placement}</span>
        </Tooltip>
      ))}
    </div>
  ),
};
