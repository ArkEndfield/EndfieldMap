import { useAnnouncement } from '@endfieldmap/map-hooks';
import { AnnouncementIcon, BookIcon, FeedbackIcon } from '@endfieldmap/web-components';
import { HeaderMenuTemplate } from '@themes/endfield/ui/menus/left/_template';
import { Announcements } from '@themes/endfield/ui/menus/left/announcement/announcements';
import { AnnouncementsDialog } from '@themes/endfield/ui/menus/left/announcement/dialog';
import { Feedback } from '@themes/endfield/ui/menus/left/announcement/feedback';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { service } from '@/services';

export const HeaderMenuAnnouncement = observer(({ className }: { className?: string }) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('header');
  const [activeTab, setActiveTab] = useState('change_log');
  const {
    list,
    listError,
    listLoading,
    detail,
    detailLoading,
    detailError,
    loadDetail,
    hasUnread,
    hasUnprompted,
    markPrompted,
  } = useAnnouncement(service);
  const showAnnouncements = activeTab !== 'feedback';
  const listData = list[activeTab];

  // 检测到新公告时自动弹窗（每条公告只自动提示一次）。
  // 只打开弹窗、不 loadDetail —— 预览即已读，自动预览会误清红点与 "new" 标记。
  useEffect(() => {
    if (!hasUnprompted) return;
    setOpen(true);
    markPrompted();
  }, [hasUnprompted, markPrompted]);

  const handleOpen = () => {
    setOpen(true);
  };

  const tabs = [
    {
      key: 'change_log',
      title: t('announcement.change_log'),
      icon: <BookIcon />,
      hasUnread: list['change_log']?.hasUnread,
    },
    {
      key: 'feedback',
      title: t('announcement.feedback'),
      icon: <FeedbackIcon />,
    },
  ] as const;

  return (
    <HeaderMenuTemplate
      icon={<AnnouncementIcon />}
      title={t('announcement.title')}
      onClick={handleOpen}
      className={className}
      hasUnread={hasUnread}
    >
      <AnnouncementsDialog
        open={open}
        onOpenChange={setOpen}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <Announcements
          hidden={!showAnnouncements}
          list={listData}
          listLoading={listLoading}
          listError={listError}
          detail={detail}
          detailLoading={detailLoading}
          detailError={detailError}
          loadDetail={loadDetail}
        />
        <Feedback hidden={showAnnouncements} />
      </AnnouncementsDialog>
    </HeaderMenuTemplate>
  );
});
