import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { ButtonWithAudio } from '@endfieldmap/web-components/components/button_with_audio';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

const meta: Meta<typeof ButtonWithAudio> = {
  title: 'Components/ButtonWithAudio',
  component: ButtonWithAudio,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    soundType: {
      control: 'select',
      options: Object.values(SoundType),
      description: 'Sound effect to play on click',
    },
    disabled: {
      control: 'boolean',
    },
    children: {
      control: 'text',
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonWithAudio>;

export const Default: Story = {
  args: {
    children: 'Click me',
    soundType: SoundType.CLICK,
    style: { padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' },
  },
};

export const SoundTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {Object.entries(SoundType).map(([key, value]) => (
        <ButtonWithAudio
          key={key}
          soundType={value}
          style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
        >
          {key}
        </ButtonWithAudio>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
    style: { padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4, opacity: 0.5 },
  },
};
