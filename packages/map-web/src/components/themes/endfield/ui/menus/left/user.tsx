import { HeaderMenuTemplate } from '@themes/endfield/ui/menus/left/_template';
import { useState } from 'react';
import { useTranslation } from '@endfieldmap/map-service';

import { UserIcon } from '@/components/common/icons';
import { UserCenter } from '@/components/features/user';

export const HeaderMenuUser = ({ className }: { className?: string }) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('header');

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <HeaderMenuTemplate icon={<UserIcon />} title={t('user.title')} onClick={handleOpen} className={className}>
      <UserCenter open={open} setOpen={setOpen} />
    </HeaderMenuTemplate>
  );
};
