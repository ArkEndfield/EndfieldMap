import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { EndfieldInput } from '@endfieldmap/web-components/components/input/index';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof EndfieldInput> = {
  title: 'Components/Input',
  component: EndfieldInput,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    inputType: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'tel', 'url', 'textarea'],
    },
    soundType: {
      control: 'select',
      options: Object.values(SoundType),
    },
    defaultValue: { control: 'text' },
    placeholder: { control: 'text' },
    maxLength: { control: 'number' },
    minLength: { control: 'number' },
    pattern: { control: 'text' },
    rows: { control: 'number' },
    cols: { control: 'number' },
    disabled: { control: 'boolean' },
    content: { control: false },
    onValueChange: { action: 'valueChanged' },
  },
};

export default meta;
type Story = StoryObj<typeof EndfieldInput>;

export const Text: Story = {
  args: {
    placeholder: 'Enter text...',
    inputType: 'text',
  },
};

export const Password: Story = {
  args: {
    placeholder: 'Enter password...',
    inputType: 'password',
  },
};

export const Textarea: Story = {
  args: {
    placeholder: 'Enter long text...',
    inputType: 'textarea',
    rows: 4,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Cannot edit...',
    inputType: 'text',
    disabled: true,
  },
};

export const WithMaxLength: Story = {
  args: {
    placeholder: 'Max 20 chars',
    inputType: 'text',
    maxLength: 20,
  },
};
