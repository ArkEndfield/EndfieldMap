import { EndfieldSelect } from '@endfieldmap/web-components/components/select/index';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';

const meta: Meta<typeof EndfieldSelect> = {
  title: 'Components/Select',
  component: EndfieldSelect,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

const options = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' },
  { label: 'Disabled Option', value: 'd', disabled: true },
] as const;

const SelectDemo = () => {
  const [value, setValue] = useState<string>('a');
  return (
    <div style={{ width: 200 }}>
      <EndfieldSelect options={options} value={value} onChange={setValue} />
    </div>
  );
};

export const Default: StoryObj = {
  render: () => <SelectDemo />,
};

const DisabledDemo = () => {
  return (
    <div style={{ width: 200 }}>
      <EndfieldSelect options={options} value="a" onChange={() => {}} disabled />
    </div>
  );
};

export const Disabled: StoryObj = {
  render: () => <DisabledDemo />,
};
