import { useTranslation } from 'react-i18next';
import { HeaderMenuTemplate } from '@themes/endfield/ui/menus/left/_template';
import { useState } from 'react';

import { AnnouncementIcon, BookIcon, FeedbackIcon } from '@endfieldmap/web-components';
import { AnnouncementsDialog } from '@themes/endfield/ui/menus/left/announcement/dialog';
import { useAnnouncement } from '@endfieldmap/map-hooks';
import { service } from '@/services';
import { Announcements } from '@themes/endfield/ui/menus/left/announcement/announcements';
import { Feedback } from '@themes/endfield/ui/menus/left/announcement/feedback';
import { observer } from 'mobx-react-lite';

export const HeaderMenuAnnouncement = observer(({ className }: { className?: string }) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('header');
  const [activeTab, setActiveTab] = useState('change_log');
  const { list, listError, listLoading, detail, detailLoading, detailError, loadDetail, hasUnread } =
    useAnnouncement(service);
  const showAnnouncements = activeTab !== 'feedback';
  const listData = list[activeTab];

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
