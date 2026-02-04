import { observer } from 'mobx-react-lite';

import { alert } from '@/components/common/alert/alert_api';
import { UserModal } from '@/components/common/user/modal';
import { userService } from '@/services/user';

import { ActionPanel } from './action_panel';
import type { UidData, UserData } from './types';
import { UidList } from './uid_list';
import { UserProfile } from './user_profile';

// ==================== 主组件 ====================
export const UserInfoModal = observer(({ open, onClose }: { open: boolean; onClose: () => void }) => {
  // 模拟数据
  const mockUser: UserData = {
    avatar: '/images/avatar/default.png',
    nickname: '我是小白啦啦啦',
    uid: '14785123',
    isSynced: true,
    boundUidCount: 5,
  };

  const mockUidList: UidData[] = [
    { uid: '100740568', dataCount: 1057, isActive: true },
    { uid: '100740568', dataCount: 1057 },
    { uid: '100740568', dataCount: 1057 },
    { uid: '100740568', dataCount: 1057 },
    { uid: '100740568', dataCount: 1057 },
    { uid: '100740568', dataCount: 1057 },
    { uid: '100740568', dataCount: 1057 },
  ];

  // 事件处理函数
  const handleSync = () => {
    console.log('同步数据');
  };

  const handleDeleteUid = (uid: string) => {
    console.log('删除绑定:', uid);
  };

  const handleSwitchToUid = (uid: string) => {
    console.log('切换到UID:', uid);
  };

  const handleLogout = async () => {
    alert.confirm({
      content: '确定要登出吗？',
      onConfirm: async () => {
        alert.confirm({
          content: '是否要清除本地数据（不会清除云端数据）？',
          dismissible: false,
          onConfirm: async () => {
            await userService.logout();
          },
          onCancel: async () => {
            await userService.logout();
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
        <UserProfile user={mockUser} onSync={handleSync} />

        {/* 中间 - UID 列表 */}
        <UidList uidList={mockUidList} onDeleteUid={handleDeleteUid} onSwitchUid={handleSwitchToUid} />

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
