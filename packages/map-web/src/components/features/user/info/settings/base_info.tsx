import { observer } from 'mobx-react-lite';
import { alert } from '@/components/common/alert/alert_api';
import { EditIcon } from '@/components/common/icons';
import { ZmdRoundIconButton } from '@/components/common/endfield_components/button/round_icon_button';
import { userService } from '@/services/user';
import { catchErrorWithTip } from '@/utils/handler';
import { useTranslation } from 'react-i18next';

/** 信息项组件 */
const InfoItem = ({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) => (
  <div className="flex items-center justify-between py-1 border-b border-black/5 last:border-b-0 min-h-12">
    <div className="flex flex-col">
      <span className="text-[10px] text-black/40 leading-tight">{label}</span>
      <span className="text-sm text-black font-medium leading-tight">{value}</span>
    </div>
    {onEdit && (
      <ZmdRoundIconButton onClick={onEdit} className="w-7 h-7">
        <EditIcon className="w-3 h-3" />
      </ZmdRoundIconButton>
    )}
  </div>
);

/**
 * 用户基础信息设置组件
 */
export const BaseInfo = observer(() => {
  const userInfo = userService.auth.userInfo;
  const { t } = useTranslation('header');

  if (!userInfo) {
    return null;
  }

  /** 修改昵称 */
  const handleEditNickname = async () => {
    const nickname = await alert.prompt({
      content: t('user.info.nickname.edit_tip'),
      defaultValue: userInfo.nickname || '',
    });
    if (!nickname) return;
    catchErrorWithTip(async () => {
      await userService.updateUserInfo({ nickname });
      alert.info(t('user.info.nickname.edit_success'));
    });
  };

  return (
    <div className="bg-black/5 rounded-lg px-3 mb-4">
      <InfoItem label={t('user.username')} value={userInfo.username} />
      <InfoItem label={t('user.nickname')} value={userInfo.nickname} onEdit={handleEditNickname} />
    </div>
  );
});
