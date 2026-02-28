import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ZmdAlertCloseIcon, ZmdAlertTickIcon } from '../icons/alert';

import { EndfieldFormButton } from '@endfieldmap/web-components/components/button/form_button';
import { ZmdRoundButton } from '@endfieldmap/web-components/components/button/round_button';
import { ZmdRoundIconButton } from '@endfieldmap/web-components/components/button/round_icon_button';
import { ZmdSquareButton } from '@endfieldmap/web-components/components/button/square_button';
import { ZmdSquareIconButton } from '@endfieldmap/web-components/components/button/square_icon_button';

const meta: Meta = {
  title: 'Components/Button',
  parameters: {
    layout: 'centered',
  },
};

export default meta;

export const RoundButton: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <ZmdRoundButton type="primary" text="Confirm" icon={<ZmdAlertTickIcon />} onClick={() => {}} />
      <ZmdRoundButton type="default" text="Cancel" icon={<ZmdAlertCloseIcon />} onClick={() => {}} />
      <ZmdRoundButton type="primary" text="Loading" icon={<ZmdAlertTickIcon />} loading onClick={() => {}} />
      <ZmdRoundButton type="primary" text="Disabled" icon={<ZmdAlertTickIcon />} disabled onClick={() => {}} />
    </div>
  ),
};

export const SquareButton: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <ZmdSquareButton type="primary" text="Primary" icon={<ZmdAlertTickIcon />} onClick={() => {}} />
      <ZmdSquareButton type="default" text="Default" icon={<ZmdAlertCloseIcon />} onClick={() => {}} />
      <ZmdSquareButton
        type="primary"
        text="Icon Left"
        icon={<ZmdAlertTickIcon />}
        iconPosition="left"
        onClick={() => {}}
      />
      <ZmdSquareButton type="primary" text="Loading" icon={<ZmdAlertTickIcon />} loading onClick={() => {}} />
      <ZmdSquareButton type="primary" text="Disabled" icon={<ZmdAlertTickIcon />} disabled onClick={() => {}} />
      <ZmdSquareButton type="primary" text="No Icon" showIcon={false} onClick={() => {}} />
    </div>
  ),
};

export const RoundIconButton: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <ZmdRoundIconButton>
        <ZmdAlertTickIcon />
      </ZmdRoundIconButton>
      <ZmdRoundIconButton>
        <ZmdAlertCloseIcon />
      </ZmdRoundIconButton>
      <ZmdRoundIconButton disabled>
        <ZmdAlertTickIcon />
      </ZmdRoundIconButton>
    </div>
  ),
};

export const SquareIconButton: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <ZmdSquareIconButton>
        <ZmdAlertTickIcon />
      </ZmdSquareIconButton>
      <ZmdSquareIconButton>
        <ZmdAlertCloseIcon />
      </ZmdSquareIconButton>
    </div>
  ),
};

export const FormButton: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 240 }}>
      <EndfieldFormButton variant="primary">Primary</EndfieldFormButton>
      <EndfieldFormButton variant="default">Default</EndfieldFormButton>
      <EndfieldFormButton variant="warning">Warning</EndfieldFormButton>
      <EndfieldFormButton variant="danger">Danger</EndfieldFormButton>
      <EndfieldFormButton variant="primary" disabled>
        Disabled
      </EndfieldFormButton>
    </div>
  ),
};
