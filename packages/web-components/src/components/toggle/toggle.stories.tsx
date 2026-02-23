import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { CheckboxToggle } from './checkbox_toggle';
import { EndfieldToggle } from './index';

const meta: Meta = {
  title: 'Components/Toggle',
  parameters: {
    layout: 'centered',
  },
};

export default meta;

const tabOptions = [
  { key: 'a', label: 'Option A' },
  { key: 'b', label: 'Option B' },
  { key: 'c', label: 'Option C' },
] as const;

const TabToggleDemo = () => {
  const [active, setActive] = useState<string>('a');
  return (
    <div style={{ width: 300 }}>
      <EndfieldToggle options={tabOptions} activeKey={active} onChange={setActive} />
    </div>
  );
};

export const TabToggle: StoryObj = {
  render: () => <TabToggleDemo />,
};

const TwoTabDemo = () => {
  const [active, setActive] = useState<string>('on');
  return (
    <div style={{ width: 200 }}>
      <EndfieldToggle
        options={[
          { key: 'on', label: 'ON' },
          { key: 'off', label: 'OFF' },
        ]}
        activeKey={active}
        onChange={setActive}
      />
    </div>
  );
};

export const TwoTabs: StoryObj = {
  render: () => <TwoTabDemo />,
};

const CheckboxDemo = () => {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{ background: '#2a2728', padding: 24, borderRadius: 8 }}>
      <CheckboxToggle checked={checked} onToggle={() => setChecked(!checked)} label="Enable feature" />
    </div>
  );
};

export const Checkbox: StoryObj = {
  render: () => <CheckboxDemo />,
};

const CheckboxSmallDemo = () => {
  const [checked, setChecked] = useState(true);
  return (
    <div style={{ background: '#2a2728', padding: 24, borderRadius: 8 }}>
      <CheckboxToggle checked={checked} onToggle={() => setChecked(!checked)} label="Small size" size="sm" />
    </div>
  );
};

export const CheckboxSmall: StoryObj = {
  render: () => <CheckboxSmallDemo />,
};

const IndeterminateDemo = () => {
  return (
    <div style={{ background: '#2a2728', padding: 24, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CheckboxToggle checked={false} isIndeterminate onToggle={() => {}} label="Indeterminate" />
      <CheckboxToggle checked={true} onToggle={() => {}} label="Checked" />
      <CheckboxToggle checked={false} onToggle={() => {}} label="Unchecked" />
    </div>
  );
};

export const States: StoryObj = {
  render: () => <IndeterminateDemo />,
};

const NoBorderDemo = () => {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{ background: '#2a2728', padding: 24, borderRadius: 8 }}>
      <CheckboxToggle checked={checked} onToggle={() => setChecked(!checked)} label="No border" hideBorder />
    </div>
  );
};

export const NoBorder: StoryObj = {
  render: () => <NoBorderDemo />,
};

const DisabledDemo = () => {
  return (
    <div style={{ background: '#2a2728', padding: 24, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CheckboxToggle checked={true} onToggle={() => {}} label="Disabled (checked)" disabled />
      <CheckboxToggle checked={false} onToggle={() => {}} label="Disabled (unchecked)" disabled />
    </div>
  );
};

export const Disabled: StoryObj = {
  render: () => <DisabledDemo />,
};
