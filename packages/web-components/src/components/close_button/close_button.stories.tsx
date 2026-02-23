import type { Meta, StoryObj } from '@storybook/react-vite';

import { CloseButton } from '@endfieldmap/web-components/components/close_button';

const meta: Meta<typeof CloseButton> = {
  title: 'Components/CloseButton',
  component: CloseButton,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  argTypes: {
    onClose: { action: 'closed' },
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof CloseButton>;

export const Default: Story = {
  args: {},
};

export const CustomSize: Story = {
  args: {
    className: 'w-10 h-10',
  },
};
