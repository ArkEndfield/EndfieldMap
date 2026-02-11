import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { Dialog } from '@/components/common/dialog';
import { BindIcon, EditIcon } from '@/components/common/icons';
import { UserModal } from '@/components/common/user/modal';
import { ActionPanel } from '@/components/features/user/info/action_panel';
import { BindUid } from '@/components/features/user/info/bind_uid';
import { Settings } from '@/components/features/user/info/settings';
import { UidList } from '@/components/features/user/info/uid_list';
import { UserProfile } from '@/components/features/user/info/user_profile';
import { userService } from '@/services/user';
import { catchErrorWithTip } from '@/utils/handler';

// ==================== 主组件 ====================
export const UserInfoModal = observer(({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [bindUidOpen, setBindUidOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { t } = useTranslation('header');

  const uidList = userService.auth.uidList;
  const uidInfo = userService.auth.currentUidInfo;
  const userInfo = userService.auth.userInfo;

  const handleDeleteUid = (uid: string) => {
    alert.confirm({
      content: t('user.uid.unbind_confirm'),
      onConfirm: async () => {
        catchErrorWithTip(async () => {
          await userService.unbindUid(uid);
        });
        return true;
      },
    });
  };

  const handleSwitchToUid = (uid: string) => {
    userService.switchUid(uid);
  };

  const handleLogout = async () => {
    alert.confirm({
      content: t('user.logout_confirm'),
      onConfirm: async () => {
        alert.confirm({
          content: t('user.logout_confirm_clear_data'),
          dismissible: false,
          onConfirm: async () => {
            await userService.logout(false);
            return true;
          },
          onCancel: async () => {
            await userService.logout(true);
            return true;
          },
        });
      },
    });
  };

  const handleBindUid = () => {
    setBindUidOpen(true);
  };

  const handleBindUidClose = () => {
    setBindUidOpen(false);
  };

  const handleEditInfo = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  if (!userInfo) {
    return null;
  }

  return (
    <>
      <UserModal open={open} onClose={onClose} className="w-4xl" keyboardCloseable={!bindUidOpen && !settingsOpen}>
        <div className="flex gap-6 p-6 h-80">
          {/* 左侧 - 用户资料 */}
          <UserProfile uidInfo={uidInfo} userInfo={userInfo} />

          {/* 中间 - UID 列表 */}
          <UidList
            uidList={uidList}
            isChecked={(data) => data.uid === uidInfo?.uid}
            renderActions={(data) => (
              <>
                <button
                  hidden={data.is_default}
                  onClick={() => handleDeleteUid(data.uid)}
                  className="px-2 py-1 text-xs text-[#FDFB73]/70 hover:text-[#FDFB73] border border-[#FDFB73]/30 hover:border-[#FDFB73]/60 rounded transition-colors"
                >
                  {t('user.uid.delete')}
                </button>
                <button
                  hidden={data.uid === uidInfo?.uid}
                  onClick={() => handleSwitchToUid(data.uid)}
                  className="px-2 py-1 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-colors"
                >
                  {t('user.uid.switch')}
                </button>
              </>
            )}
          />

          {/* 右侧 - 操作面板 */}
          <ActionPanel onLogout={handleLogout} onBindUid={handleBindUid} onEditInfo={handleEditInfo} />
        </div>
      </UserModal>

      {/* 绑定 UID 对话框 */}
      <Dialog
        dismissible={false}
        keyboardCloseable
        open={bindUidOpen}
        onOpenChange={setBindUidOpen}
        onClose={handleBindUidClose}
        icon={<BindIcon />}
        width="25rem"
      >
        <BindUid />
      </Dialog>

      {/* 修改信息对话框 */}
      <Dialog
        dismissible={false}
        keyboardCloseable
        title={t('user.info.edit')}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onClose={handleSettingsClose}
        icon={<EditIcon />}
        width="28rem"
      >
        <Settings />
      </Dialog>
    </>
  );
});
