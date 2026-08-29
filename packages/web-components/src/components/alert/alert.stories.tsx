import { ZmdAlert } from '@endfieldmap/web-components/components/alert/alert';
import { ZmdAlertFull } from '@endfieldmap/web-components/components/alert/alert_full';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';

const meta: Meta<typeof ZmdAlert> = {
  title: 'Components/Alert',
  component: ZmdAlert,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    open: { control: 'boolean' },
    hideCancel: { control: 'boolean' },
    cancelText: { control: 'text' },
    confirmText: { control: 'text' },
    loading: { control: 'boolean' },
    showIcon: { control: 'boolean' },
    width: { control: 'text' },
    height: { control: 'text' },
    onDismiss: { action: 'dismissed' },
    onCancel: { action: 'cancelled' },
    onConfirm: { action: 'confirmed' },
    classNames: { control: false },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof ZmdAlert>;

const AlertDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(true)} style={{ padding: '8px 16px' }}>
        Open Alert
      </button>
      <ZmdAlert
        open={open}
        onDismiss={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      >
        <p>This is an alert message.</p>
      </ZmdAlert>
    </div>
  );
};

export const Default: Story = {
  render: () => <AlertDemo />,
};

const AlertHideCancelDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(true)} style={{ padding: '8px 16px' }}>
        Open Alert (No Cancel)
      </button>
      <ZmdAlert open={open} hideCancel onDismiss={() => setOpen(false)} onConfirm={() => setOpen(false)}>
        <p>This alert has no cancel button.</p>
      </ZmdAlert>
    </div>
  );
};

export const HideCancel: Story = {
  render: () => <AlertHideCancelDemo />,
};

const AlertFullDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(true)} style={{ padding: '8px 16px' }}>
        Open Full Alert
      </button>
      <ZmdAlertFull
        open={open}
        onDismiss={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      >
        <p>This is a full-width alert message with more content.</p>
      </ZmdAlertFull>
    </div>
  );
};

export const Full: StoryObj<typeof ZmdAlertFull> = {
  render: () => <AlertFullDemo />,
};
