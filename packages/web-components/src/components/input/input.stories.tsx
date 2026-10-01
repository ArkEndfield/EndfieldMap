import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { EndfieldInput } from '@endfieldmap/web-components/components/input/index';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

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

/**
 * 受控模式：外部持有状态驱动 value，autoFocus 关掉避免两个输入框抢焦点。
 * 两个输入框同页互不干扰是回归点（ autoFocus 默认 true 曾让同页第二框失焦）。
 * 组件提为具名大写函数：render 回调里直接调 Hook 会被 rules-of-hooks 拒绝。
 */
function ControlledPairDemo() {
  const [name, setName] = useState('route-42');
  const [note, setNote] = useState('');
  return (
    <div className="flex flex-col gap-6 w-80">
      <EndfieldInput
        value={name}
        onValueChange={setName}
        autoFocus={false}
        placeholder="Name"
        inputType="text"
      />
      <EndfieldInput
        value={note}
        onValueChange={setNote}
        autoFocus={false}
        placeholder="Note (controlled, empty string allowed)"
        inputType="text"
      />
      <div className="text-xs opacity-60">
        name=&quot;{name}&quot; note=&quot;{note}&quot;
      </div>
    </div>
  );
}

export const ControlledPair: Story = {
  name: 'Controlled (two inputs, no focus fight)',
  argTypes: {
    value: { control: false },
    onValueChange: { action: 'valueChanged' },
  },
  render: () => <ControlledPairDemo />,
};
