import type { Meta, StoryObj } from '@storybook/react-vite';

import { LogoLoading } from '.';

const meta: Meta<typeof LogoLoading> = {
  title: 'Components/LogoLoading',
  component: LogoLoading,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    className: { control: 'text' },
    glowColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof LogoLoading>;

export const Default: Story = {
  args: {
    className: 'text-[#81807f] text-6xl',
    glowColor: '#ffffff',
  },
  render: (args) => (
    <div
      style={{ background: '#1e1c1c', padding: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center' }}
    >
      <LogoLoading {...args} />
    </div>
  ),
};

export const CustomColor: Story = {
  args: {
    className: 'text-[#4d4d4d] text-[100px]',
    glowColor: '#ffcc00',
  },
  render: (args) => (
    <div
      style={{ background: '#2a2728', padding: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center' }}
    >
      <LogoLoading {...args} />
    </div>
  ),
};
