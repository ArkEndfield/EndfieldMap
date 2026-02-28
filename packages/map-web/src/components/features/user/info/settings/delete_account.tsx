import { useTranslation } from '@endfieldmap/map-service';
import { ZmdSquareButton } from '@endfieldmap/web-components';

import { alert } from '@/components/common/alert/alert_api';
import { TrashIcon } from '@endfieldmap/web-components';
import { service } from '@/services';
import { catchErrorWithTip } from '@/utils/handler';

export const DeleteAccount = () => {
  const { t } = useTranslation('header');
  /** 注销账户（预留） */
  const handleDeleteAccount = () => {
    alert.confirm({
      content: t('user.remove_account.confirm'),
      onConfirm: () =>
        catchErrorWithTip(async () => {
          await service.userService.deleteAccount();
          alert.info(t('user.remove_account.success'));
          return true;
        }),
    });
  };

  return (
    <ZmdSquareButton
      type="default"
      icon={<TrashIcon />}
      onClick={handleDeleteAccount}
      className="flex-1 text-base py-2"
      classNames={{ text: 'text-red-500' }}
    >
      {t('user.remove_account.title')}
    </ZmdSquareButton>
  );
};
