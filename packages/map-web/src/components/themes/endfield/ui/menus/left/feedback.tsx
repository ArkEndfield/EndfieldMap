import { useTranslation } from '@endfieldmap/map-service';
import { Dialog } from '@endfieldmap/web-components';
import { HeaderMenuTemplate } from '@themes/endfield/ui/menus/left/_template';
import { useState } from 'react';

import { FeedbackIcon } from '@endfieldmap/web-components';

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
        keyboardCloseable={true}
        classNames={{
          contentContainer: 'h-full flex flex-col flex-1',
        }}
      >
        <iframe
          src="https://docs.zmdmap.com/share/shrc22t2uOoeZGKm3eP/view?embed=true"
          className="border-0 w-full flex-1"
        />
      </Dialog>
    </HeaderMenuTemplate>
  );
};
