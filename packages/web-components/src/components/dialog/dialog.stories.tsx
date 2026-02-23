import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Dialog } from './index';

const meta: Meta<typeof Dialog> = {
  title: 'Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
    dismissible: { control: 'boolean' },
    keyboardCloseable: { control: 'boolean' },
    width: { control: 'text' },
    height: { control: 'text' },
    className: { control: 'text' },
    icon: { control: false },
    children: { control: false },
    classNames: { control: false },
    onOpenChange: { action: 'openChange' },
    onDismiss: { action: 'dismissed' },
    onClose: { action: 'closed' },
  },
};

export default meta;

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const DefaultDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(true)} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4 }}>
        Open Dialog
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        onClose={() => setOpen(false)}
        title="Settings"
        icon={<SettingsIcon />}
      >
        <div style={{ padding: 24 }}>
          <p style={{ color: '#333', marginBottom: 12 }}>This is the dialog content area.</p>
          <p style={{ color: '#666', fontSize: 14 }}>You can place any content here, such as forms, lists, or information.</p>
        </div>
      </Dialog>
    </div>
  );
};

export const Default: StoryObj = {
  render: () => <DefaultDemo />,
};

const NonDismissibleDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(true)} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4 }}>
        Open Non-Dismissible
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        onClose={() => setOpen(false)}
        title="Important Notice"
        icon={<SettingsIcon />}
        dismissible={false}
      >
        <div style={{ padding: 24 }}>
          <p style={{ color: '#333' }}>This dialog cannot be dismissed by clicking the backdrop. Use the close button.</p>
        </div>
      </Dialog>
    </div>
  );
};

export const NonDismissible: StoryObj = {
  render: () => <NonDismissibleDemo />,
};

const CustomSizeDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(true)} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4 }}>
        Open Custom Size
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        onClose={() => setOpen(false)}
        title="Custom Size Dialog"
        icon={<SettingsIcon />}
        width="600px"
        height="400px"
      >
        <div style={{ padding: 24 }}>
          <p style={{ color: '#333' }}>This dialog has custom width (600px) and height (400px).</p>
        </div>
      </Dialog>
    </div>
  );
};

export const CustomSize: StoryObj = {
  render: () => <CustomSizeDemo />,
};

const LongContentDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(true)} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4 }}>
        Open Long Content
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        onClose={() => setOpen(false)}
        title="Long Content"
        icon={<SettingsIcon />}
        height="400px"
      >
        <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i} style={{ color: '#333', marginBottom: 8 }}>
              Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          ))}
        </div>
      </Dialog>
    </div>
  );
};

export const LongContent: StoryObj = {
  render: () => <LongContentDemo />,
};
