import { observer } from 'mobx-react-lite';

import { alert } from '@/components/common/alert/alert_api';
import { UserModal } from '@/components/common/user/modal';
import { userService } from '@/services/user';

import { ActionPanel } from './action_panel';
import { UidList } from './uid_list';
import { UserProfile } from './user_profile';

// ==================== 主组件 ====================
export const UserInfoModal = observer(({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const uidList = userService.auth.uidList;
  const uidInfo = userService.auth.currentUidInfo;

  // 事件处理函数
  // const handleSync = () => {
  //   console.log('同步数据');
  // };

  const handleDeleteUid = (uid: string) => {
    console.log('删除绑定:', uid);
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
          },
          onCancel: async () => {
            await userService.logout(true);
          },
        });
      },
    });
  };

  const handleLogin = () => {
    console.log('登录');
  };

  const handleSwitchUid = () => {
    console.log('切换UID');
  };

  return (
    <UserModal open={open} onClose={onClose} className="w-4xl">
      <div className="flex gap-6 p-6 h-80">
        {/* 左侧 - 用户资料 */}
        <UserProfile uidInfo={uidInfo} />

        {/* 中间 - UID 列表 */}
        <UidList
          uidList={uidList}
          activeUid={uidInfo?.uid}
          onDeleteUid={handleDeleteUid}
          onSwitchUid={handleSwitchToUid}
        />

        {/* 右侧 - 操作面板 */}
        <ActionPanel
          syncedDataCount={1456}
          onLogout={handleLogout}
          onLogin={handleLogin}
          onSwitchUid={handleSwitchUid}
        />
      </div>
    </UserModal>
  );
});
