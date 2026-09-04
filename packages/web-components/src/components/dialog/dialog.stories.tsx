import {
  Dialog,
  DialogActions,
  DialogArticle,
  DialogContentDivider,
  DialogContentTitle,
  DialogHatchedDivider,
  DialogHeaderStrip,
  DialogMetaRow,
  DialogNotice,
  DialogRadioOption,
  DialogSectionLabel,
  DialogStatDivider,
  DialogStatItem,
  DialogStatList,
  DialogTabs,
} from '@endfieldmap/web-components/components/dialog/index';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';

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

const NoticeContentDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(true)} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4 }}>
        Open Notice Content
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        onClose={() => setOpen(false)}
        title="公告"
        icon={<SettingsIcon />}
        width="960px"
        height="620px"
      >
        <div style={{ padding: '24px 32px', overflow: 'auto', height: '100%', background: '#fafafa' }}>
          <DialogMetaRow type="公告" date="2026.09.02 09:00" />
          <DialogContentTitle>「雪凇幽梦」版本更新说明</DialogContentTitle>
          <DialogContentDivider />
          <DialogArticle className="!mt-2.5">
            <p>亲爱的管理员：</p>
            <p>欢迎来到全新版本「雪凇幽梦」！</p>
            <h2>▼//更新维护及补偿说明</h2>
            <h3>■ 更新维护时间</h3>
            <p>2026/09/02 06:00 - 2026/09/02 12:00（UTC+8）</p>
            <p>※ 维护后的开服时间存在提前或延迟的可能，详情请关注官方公告。</p>
            <h3>■ 更新维护及问题修复补偿说明</h3>
            <p>
              <strong>1. 探索任务</strong>
              「据点建设·盈天台建设站·其三」「悬崖下的靶场」「钟鸣人归」
            </p>
            <p>· 更新维护补偿内容：【嵌晶玉】×900</p>
            <p>· 发放时间：2026/09/02更新维护后 - 下次版本更新维护前</p>
            <h2>▼//版本全新内容</h2>
            <h3>■ 全新干员</h3>
            <p>6星干员【提弗洛斯】、5星干员【噗切娜】</p>
            <h3>■ 补偿一览</h3>
            <table>
              <tbody>
                <tr className="table-title">
                  <td colSpan={2}>补偿内容一览</td>
                </tr>
                <tr>
                  <th>项目</th>
                  <th>内容</th>
                </tr>
                <tr>
                  <td>更新维护补偿</td>
                  <td>【嵌晶玉】×900</td>
                </tr>
                <tr>
                  <td>问题修复补偿</td>
                  <td>【嵌晶玉】×900</td>
                </tr>
              </tbody>
            </table>
          </DialogArticle>
          <DialogHatchedDivider />
          <DialogNotice>※ 以上内容请以游戏内实际为准。</DialogNotice>
        </div>
      </Dialog>
    </div>
  );
};

export const NoticeContent: StoryObj = {
  render: () => <NoticeContentDemo />,
};

const FormContentDemo = () => {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<'a' | 'b'>('a');
  const [radio, setRadio] = useState('pc');
  return (
    <div>
      <button onClick={() => setOpen(true)} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 4 }}>
        Open Form Content
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        onClose={() => setOpen(false)}
        title="预约"
        icon={<SettingsIcon />}
        width="720px"
        height="480px"
      >
        <div className="flex flex-col h-full">
          <DialogTabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: 'a', label: '全部平台' },
              { key: 'b', label: '我的预约' },
            ]}
          />
          <div style={{ padding: '20px 36px', flex: 1, overflow: 'auto', background: '#fafafa' }}>
            <DialogHeaderStrip>
              <div className="flex items-center text-[15px] text-[#191919]">
                <span className="font-medium">当前账号</span>
                <span className="w-px h-4 bg-[#ccc] mx-4" />
                <span>Dr.***42</span>
              </div>
            </DialogHeaderStrip>
            <DialogSectionLabel>选择预约平台</DialogSectionLabel>
            <div className="flex gap-6 mt-5">
              {[
                { key: 'pc', label: 'PC' },
                { key: 'ps5', label: 'PS5' },
                { key: 'android', label: 'Android' },
                { key: 'ios', label: 'iOS' },
              ].map((p) => (
                <DialogRadioOption key={p.key} checked={radio === p.key} onClick={() => setRadio(p.key)}>
                  {p.label}
                </DialogRadioOption>
              ))}
            </div>
            <DialogHatchedDivider />
            <DialogStatList className="mt-8">
              <DialogStatItem label="预约人数">1,234,567</DialogStatItem>
              <DialogStatDivider />
              <DialogStatItem label="今日新增">8,901</DialogStatItem>
              <DialogStatDivider />
              <DialogStatItem label="我的积分">128</DialogStatItem>
            </DialogStatList>
            <DialogNotice>※ 预约奖励将在游戏上线后通过邮件发放。</DialogNotice>
            <DialogActions className="mt-8">
              <button
                style={{ padding: '10px 48px', background: '#ffff21', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                立即预约
              </button>
              <button style={{ padding: '10px 48px', background: '#e5e5e5', border: 'none', cursor: 'pointer' }}>
                稍后再说
              </button>
            </DialogActions>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export const FormContent: StoryObj = {
  render: () => <FormContentDemo />,
};
