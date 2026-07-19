import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

import {
  ClearIcon,
  EditIcon,
  ExportIcon,
  ImportIcon,
  RefreshIcon,
  ScanIcon,
  ShareIcon,
  SwitchIcon,
  SyncIcon,
  TrashIcon,
} from '../icons/action';
import { ZmdAlertCloseIcon, ZmdAlertTickIcon } from '../icons/alert';
import { Deco7Dots, InVisibleIcon, VisibleIcon } from '../icons/common';
import {
  BatchDeleteIcon,
  EditAddIcon,
  EditConnectIcon,
  EditDeleteIcon,
  EditDisconnectIcon,
  EditMoveIcon,
  MultiOperationIcon,
} from '../icons/edit';
import {
  ElectricPoleIconPipe,
  ElectricPoleIconPole,
  ElectricPoleIconRepeater,
  ElectricPoleIconZipline80,
  ElectricPoleIconZipline110,
} from '../icons/electric_pole';
import { LayoutAndLanguageIcon, LayoutIcon, ThemeIcon, TranslateIcon } from '../icons/layout';
import { Logo } from '../icons/logo';
import {
  CenterIcon,
  CenterIcon2,
  ChangeMapIcon,
  CustomPointIcon,
  FilterIcon,
  FilterMarked,
  FilterUnMarked,
  LayerIcon,
  LayersIcon,
  LayerSwitchIcon,
  LocationClusterIcon,
  MapIcon,
} from '../icons/map';
import {
  BookIcon,
  ChangeLogIcon,
  CogIcon,
  DataBaseIcon,
  FolderIcon,
  HelpIcon,
  ImageIcon,
  NotificationIcon,
  QuestionIcon,
  StoreIcon,
  TextIcon,
  ViewAltIcon,
  VisibleWithDeco,
} from '../icons/misc';
import {
  ArrowLeftIcon,
  ChevronUp,
  ChevronUpTriangle,
  DoubleChevronLeft,
  DoubleChevronRight,
  ForwardLeftIcon,
} from '../icons/navigation';
import { BilibiliIcon, ChatIcon, DiscordIcon, FeedbackIcon, QQIcon } from '../icons/social';
import {
  CheckCircleIcon,
  CloseIcon,
  CloseSquareIcon,
  DecoTriTriangle,
  EndfieldCloseSquareIcon,
  MenuIcon,
  MinusIcon,
  PiPIcon,
  PlusIcon,
  PowerIcon,
  TickCircleIcon,
} from '../icons/ui';
import { BindIcon, KeyIcon, LogInIcon, LoginIcon, LogoutIcon, UserIcon } from '../icons/user';

const meta: Meta = {
  title: 'Icons',
  parameters: {
    layout: 'centered',
  },
};

export default meta;

const IconGrid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', maxWidth: 800 }}>{children}</div>
);

const IconItem = ({ name, children }: { name: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 80 }}>
    <div style={{ fontSize: 24, color: '#fff' }}>{children}</div>
    <span style={{ fontSize: 10, color: '#999', textAlign: 'center', wordBreak: 'break-all' }}>{name}</span>
  </div>
);

export const Action: StoryObj = {
  render: () => (
    <IconGrid>
      <IconItem name="ClearIcon">
        <ClearIcon />
      </IconItem>
      <IconItem name="RefreshIcon">
        <RefreshIcon />
      </IconItem>
      <IconItem name="EditIcon">
        <EditIcon />
      </IconItem>
      <IconItem name="ExportIcon">
        <ExportIcon />
      </IconItem>
      <IconItem name="ImportIcon">
        <ImportIcon />
      </IconItem>
      <IconItem name="SwitchIcon">
        <SwitchIcon />
      </IconItem>
      <IconItem name="TrashIcon">
        <TrashIcon />
      </IconItem>
      <IconItem name="ScanIcon">
        <ScanIcon />
      </IconItem>
      <IconItem name="SyncIcon">
        <SyncIcon />
      </IconItem>
      <IconItem name="ShareIcon">
        <ShareIcon />
      </IconItem>
    </IconGrid>
  ),
};

export const Edit: StoryObj = {
  render: () => (
    <IconGrid>
      <IconItem name="MultiOperationIcon">
        <MultiOperationIcon />
      </IconItem>
      <IconItem name="EditAddIcon">
        <EditAddIcon />
      </IconItem>
      <IconItem name="EditMoveIcon">
        <EditMoveIcon />
      </IconItem>
      <IconItem name="EditDeleteIcon">
        <EditDeleteIcon />
      </IconItem>
      <IconItem name="BatchDeleteIcon">
        <BatchDeleteIcon />
      </IconItem>
      <IconItem name="EditConnectIcon">
        <EditConnectIcon />
      </IconItem>
      <IconItem name="EditDisconnectIcon">
        <EditDisconnectIcon />
      </IconItem>
    </IconGrid>
  ),
};

export const ElectricPole: StoryObj = {
  render: () => (
    <IconGrid>
      <IconItem name="Pole">
        <ElectricPoleIconPole />
      </IconItem>
      <IconItem name="Repeater">
        <ElectricPoleIconRepeater />
      </IconItem>
      <IconItem name="Zipline80">
        <ElectricPoleIconZipline80 />
      </IconItem>
      <IconItem name="Zipline110">
        <ElectricPoleIconZipline110 />
      </IconItem>
      <IconItem name="Pipe">
        <ElectricPoleIconPipe />
      </IconItem>
    </IconGrid>
  ),
};

export const Layout: StoryObj = {
  render: () => (
    <IconGrid>
      <IconItem name="TranslateIcon">
        <TranslateIcon />
      </IconItem>
      <IconItem name="LayoutAndLanguageIcon">
        <LayoutAndLanguageIcon />
      </IconItem>
      <IconItem name="LayoutIcon">
        <LayoutIcon />
      </IconItem>
      <IconItem name="ThemeIcon">
        <ThemeIcon />
      </IconItem>
    </IconGrid>
  ),
};

export const LogoIcon: StoryObj = {
  render: () => (
    <IconGrid>
      <IconItem name="Logo">
        <Logo />
      </IconItem>
    </IconGrid>
  ),
};

export const Map: StoryObj = {
  render: () => (
    <IconGrid>
      <IconItem name="CenterIcon">
        <CenterIcon />
      </IconItem>
      <IconItem name="CenterIcon2">
        <CenterIcon2 />
      </IconItem>
      <IconItem name="LocationClusterIcon">
        <LocationClusterIcon />
      </IconItem>
      <IconItem name="MapIcon">
        <MapIcon />
      </IconItem>
      <IconItem name="FilterIcon">
        <FilterIcon />
      </IconItem>
      <IconItem name="CustomPointIcon">
        <CustomPointIcon />
      </IconItem>
      <IconItem name="FilterMarked">
        <FilterMarked />
      </IconItem>
      <IconItem name="FilterUnMarked">
        <FilterUnMarked />
      </IconItem>
      <IconItem name="ChangeMapIcon">
        <ChangeMapIcon />
      </IconItem>
      <IconItem name="LayerSwitchIcon">
        <LayerSwitchIcon />
      </IconItem>
      <IconItem name="LayerIcon">
        <LayerIcon />
      </IconItem>
      <IconItem name="LayersIcon">
        <LayersIcon />
      </IconItem>
    </IconGrid>
  ),
};

export const Misc: StoryObj = {
  render: () => (
    <IconGrid>
      <IconItem name="BookIcon">
        <BookIcon />
      </IconItem>
      <IconItem name="ChangeLogIcon">
        <ChangeLogIcon />
      </IconItem>
      <IconItem name="CogIcon">
        <CogIcon />
      </IconItem>
      <IconItem name="FolderIcon">
        <FolderIcon />
      </IconItem>
      <IconItem name="HelpIcon">
        <HelpIcon />
      </IconItem>
      <IconItem name="ImageIcon">
        <ImageIcon />
      </IconItem>
      <IconItem name="NotificationIcon">
        <NotificationIcon />
      </IconItem>
      <IconItem name="QuestionIcon">
        <QuestionIcon />
      </IconItem>
      <IconItem name="TextIcon">
        <TextIcon />
      </IconItem>
      <IconItem name="ViewAltIcon">
        <ViewAltIcon />
      </IconItem>
      <IconItem name="DataBaseIcon">
        <DataBaseIcon />
      </IconItem>
      <IconItem name="VisibleWithDeco">
        <VisibleWithDeco />
      </IconItem>
      <IconItem name="StoreIcon">
        <StoreIcon />
      </IconItem>
    </IconGrid>
  ),
};

export const Navigation: StoryObj = {
  render: () => (
    <IconGrid>
      <IconItem name="ChevronUp">
        <ChevronUp />
      </IconItem>
      <IconItem name="ChevronUpTriangle">
        <ChevronUpTriangle />
      </IconItem>
      <IconItem name="DoubleChevronLeft">
        <DoubleChevronLeft />
      </IconItem>
      <IconItem name="DoubleChevronRight">
        <DoubleChevronRight />
      </IconItem>
      <IconItem name="ForwardLeftIcon">
        <ForwardLeftIcon />
      </IconItem>
      <IconItem name="ArrowLeftIcon">
        <ArrowLeftIcon />
      </IconItem>
    </IconGrid>
  ),
};

export const Social: StoryObj = {
  render: () => (
    <IconGrid>
      <IconItem name="ChatIcon">
        <ChatIcon />
      </IconItem>
      <IconItem name="FeedbackIcon">
        <FeedbackIcon />
      </IconItem>
      <IconItem name="BilibiliIcon">
        <BilibiliIcon />
      </IconItem>
      <IconItem name="QQIcon">
        <QQIcon />
      </IconItem>
      <IconItem name="DiscordIcon">
        <DiscordIcon />
      </IconItem>
    </IconGrid>
  ),
};

export const UI: StoryObj = {
  render: () => (
    <IconGrid>
      <IconItem name="CheckCircleIcon">
        <CheckCircleIcon />
      </IconItem>
      <IconItem name="CloseIcon">
        <CloseIcon />
      </IconItem>
      <IconItem name="EndfieldCloseSquareIcon">
        <EndfieldCloseSquareIcon />
      </IconItem>
      <IconItem name="CloseSquareIcon">
        <CloseSquareIcon />
      </IconItem>
      <IconItem name="MenuIcon">
        <MenuIcon />
      </IconItem>
      <IconItem name="MinusIcon">
        <MinusIcon />
      </IconItem>
      <IconItem name="PlusIcon">
        <PlusIcon />
      </IconItem>
      <IconItem name="PowerIcon">
        <PowerIcon />
      </IconItem>
      <IconItem name="PiPIcon">
        <PiPIcon />
      </IconItem>
      <IconItem name="DecoTriTriangle">
        <DecoTriTriangle />
      </IconItem>
      <IconItem name="TickCircleIcon">
        <TickCircleIcon />
      </IconItem>
    </IconGrid>
  ),
};

export const User: StoryObj = {
  render: () => (
    <IconGrid>
      <IconItem name="KeyIcon">
        <KeyIcon />
      </IconItem>
      <IconItem name="LogInIcon">
        <LogInIcon />
      </IconItem>
      <IconItem name="UserIcon">
        <UserIcon />
      </IconItem>
      <IconItem name="BindIcon">
        <BindIcon />
      </IconItem>
      <IconItem name="LogoutIcon">
        <LogoutIcon />
      </IconItem>
      <IconItem name="LoginIcon">
        <LoginIcon />
      </IconItem>
    </IconGrid>
  ),
};

export const Common: StoryObj = {
  render: () => (
    <IconGrid>
      <IconItem name="Deco7Dots">
        <Deco7Dots />
      </IconItem>
      <IconItem name="VisibleIcon">
        <VisibleIcon />
      </IconItem>
      <IconItem name="InVisibleIcon">
        <InVisibleIcon />
      </IconItem>
    </IconGrid>
  ),
};

export const Alert: StoryObj = {
  render: () => (
    <IconGrid>
      <IconItem name="ZmdAlertTickIcon">
        <ZmdAlertTickIcon />
      </IconItem>
      <IconItem name="ZmdAlertCloseIcon">
        <ZmdAlertCloseIcon />
      </IconItem>
    </IconGrid>
  ),
};
