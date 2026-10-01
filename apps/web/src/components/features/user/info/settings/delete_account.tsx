import { ApiError } from '@endfieldmap/map-service/service/api_error';
import { ZmdSquareButton } from '@endfieldmap/web-components';
import { TrashIcon } from '@endfieldmap/web-components';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { service } from '@/services';
import { catchErrorWithTip } from '@/utils/handler';

export const DeleteAccount = () => {
  const { t } = useTranslation('header');
  /** 注销账户：服务端 step-up——有密码账号需输入密码，第三方登录账号需最近重新登录 */
  const handleDeleteAccount = () => {
    alert.confirm({
      content: t('user.remove_account.confirm'),
      onConfirm: () =>
        catchErrorWithTip(async () => {
          try {
            await service.userService.deleteAccount();
          } catch (error) {
            if (error instanceof ApiError && error.code === 'PASSWORD_REQUIRED') {
              const password = await alert.prompt({
                content: t('user.remove_account.password_required'),
                inputType: 'password',
                maxLength: 72,
              });
              if (!password) return;
              await service.userService.deleteAccount(password);
            } else if (error instanceof ApiError && error.code === 'RECENT_LOGIN_REQUIRED') {
              alert.info({ content: t('user.remove_account.relogin_required') });
              return;
            } else {
              throw error;
            }
          }
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
