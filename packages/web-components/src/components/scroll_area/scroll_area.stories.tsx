import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ScrollArea } from '@endfieldmap/web-components/components/scroll_area';

const meta: Meta<typeof ScrollArea> = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    scrollX: { control: 'boolean' },
    scrollY: { control: 'boolean' },
    scrollbarX: { control: 'select', options: ['hidden', 'auto', 'scrollbar'] },
    scrollbarY: { control: 'select', options: ['hidden', 'auto', 'scrollbar'] },
    showScrollButtons: { control: 'boolean' },
    showEdgeButtons: { control: 'boolean' },
    autoHide: { control: 'boolean' },
    scrollBarPlacementStyle: { control: 'select', options: ['float', 'block'] },
    onScroll: { action: 'scrolled' },
    onScrollStart: { action: 'scrollStart' },
    onScrollEnd: { action: 'scrollEnd' },
  },
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

const longContent = Array.from({ length: 30 }, (_, i) => (
  <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>
    Item {i + 1} — Lorem ipsum dolor sit amet
  </div>
));

export const Vertical: Story = {
  render: (args) => (
    <div style={{ width: 300, height: 300, border: '1px solid #ccc', borderRadius: 8 }}>
      <ScrollArea {...args}>{longContent}</ScrollArea>
    </div>
  ),
  args: {
    scrollX: false,
    scrollY: true,
    autoHide: true,
  },
};

const wideContent = (
  <div style={{ width: 800, padding: 16 }}>
    <p>This content is wider than the container, scroll horizontally to see more.</p>
    <div style={{ display: 'flex', gap: 8 }}>
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            width: 80,
            height: 80,
            background: `hsl(${i * 18}, 70%, 70%)`,
            borderRadius: 8,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            fontWeight: 'bold',
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  </div>
);

export const Horizontal: Story = {
  render: (args) => (
    <div style={{ width: 400, height: 140, border: '1px solid #ccc', borderRadius: 8 }}>
      <ScrollArea {...args}>{wideContent}</ScrollArea>
    </div>
  ),
  args: {
    scrollX: true,
    scrollY: false,
    autoHide: false,
  },
};

export const WithScrollButtons: Story = {
  render: (args) => (
    <div style={{ width: 300, height: 300, border: '1px solid #ccc', borderRadius: 8 }}>
      <ScrollArea {...args}>{longContent}</ScrollArea>
    </div>
  ),
  args: {
    scrollX: false,
    scrollY: true,
    showScrollButtons: true,
    showEdgeButtons: true,
    autoHide: false,
  },
};

export const BlockPlacement: Story = {
  render: (args) => (
    <div style={{ width: 300, height: 300, border: '1px solid #ccc', borderRadius: 8 }}>
      <ScrollArea {...args}>{longContent}</ScrollArea>
    </div>
  ),
  args: {
    scrollX: false,
    scrollY: true,
    autoHide: false,
    scrollBarPlacementStyle: 'block',
  },
};
