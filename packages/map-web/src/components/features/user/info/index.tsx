import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { alert } from '@/components/common/alert/alert_api';
import { Dialog } from '@/components/common/dialog';
import { BindIcon } from '@/components/common/icons';
import { UserModal } from '@/components/common/user/modal';
import { userService } from '@/services/user';

import { ActionPanel } from '@/components/features/user/info/action_panel';
import { UidList } from '@/components/features/user/uid_list';
import { UserProfile } from '@/components/features/user/info/user_profile';
import { BindUid } from '@/components/features/user/bind_uid';
import { catchErrorWithTip } from '@/utils/handler';

// ==================== 主组件 ====================
export const UserInfoModal = observer(({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [bindUidOpen, setBindUidOpen] = useState(false);

  const uidList = userService.auth.uidList;
  const uidInfo = userService.auth.currentUidInfo;
  const userInfo = userService.auth.userInfo;

  // 事件处理函数
  // const handleSync = () => {
  //   console.log('同步数据');
  // };

  const handleDeleteUid = (uid: string) => {
    alert.confirm({
      content: '确定要解除绑定吗？',
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
      content: '确定要登出吗？',
      onConfirm: async () => {
        alert.confirm({
          content: '是否要清除本地数据（不会清除云端数据）？',
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
    console.log('修改信息');
  };

  if (!userInfo) {
    return null;
  }

  return (
    <>
      <UserModal open={open} onClose={onClose} className="w-4xl" keyboardCloseable={!bindUidOpen}>
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
                  onClick={() => handleDeleteUid(data.uid)}
                  className="px-2 py-1 text-xs text-[#FDFB73]/70 hover:text-[#FDFB73] border border-[#FDFB73]/30 hover:border-[#FDFB73]/60 rounded transition-colors"
                >
                  解除绑定
                </button>
                <button
                  hidden={data.uid === uidInfo?.uid}
                  onClick={() => handleSwitchToUid(data.uid)}
                  className="px-2 py-1 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-colors"
                >
                  切换UID
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
    </>
  );
});
