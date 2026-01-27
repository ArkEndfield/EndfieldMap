import { HeaderMenuTemplate } from '@themes/endfield/ui/menus/left/_template';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Dialog } from '@/components/common/dialog';
import { FeedbackIcon } from '@/components/common/icons';

export const HeaderMenuFeedback = ({ className }: { className?: string }) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('header');

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <HeaderMenuTemplate icon={<FeedbackIcon />} title={t('feedback.title')} onClick={handleOpen} className={className}>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        dismissible={false}
        title={t('feedback.title')}
        icon={<FeedbackIcon />}
        height="85vh"
        classNames={{
          contentContainer: 'h-full flex flex-col',
          content: 'flex-1',
          scrollContent: 'h-full flex flex-col',
        }}
      >
        {/* {['zh-CN', 'zh-TW'].includes(currentLocale) && (
          <div className="text-lg shrink-0 font-bold text-center mb-2">在「设置-关于」中加入QQ群或者Discord群</div>
        )} */}
        <iframe
          src="https://docs.zmdmap.com/share/shrc22t2uOoeZGKm3eP/view?embed=true"
          className="border-0 w-full flex-1"
        />
        {/* <h3 className="text-lg font-bold text-center mb-2 shrink-0">
          <a className="text-blue-500" href="https://discord.gg/DDgx65vaMF" target="_blank">
            Click here
          </a>{' '}
          to join the Discord server
        </h3> */}
      </Dialog>
    </HeaderMenuTemplate>
  );
};
