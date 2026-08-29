import { EndfieldSquareSwitch } from '@endfieldmap/web-components/components/switch/index';
import { EndfieldSwitch } from '@endfieldmap/web-components/components/switch/text_switch';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';

const meta: Meta = {
  title: 'Components/Switch',
  parameters: {
    layout: 'centered',
  },
};

export default meta;

const SquareSwitchDemo = () => {
  const [value, setValue] = useState(false);
  return <EndfieldSquareSwitch value={value} onValueChange={setValue} label="Toggle" />;
};

export const SquareSwitch: StoryObj = {
  render: () => <SquareSwitchDemo />,
};

const TextSwitchDemo = () => {
  const [checked, setChecked] = useState(true);
  return (
    <div style={{ width: 200 }}>
      <EndfieldSwitch checked={checked} onChange={setChecked} />
    </div>
  );
};

export const TextSwitch: StoryObj = {
  render: () => <TextSwitchDemo />,
};

const CustomTextSwitchDemo = () => {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{ width: 200 }}>
      <EndfieldSwitch checked={checked} onChange={setChecked} onText="Enabled" offText="Disabled" />
    </div>
  );
};

export const CustomTextSwitch: StoryObj = {
  render: () => <CustomTextSwitchDemo />,
};
