import type { SklandSyncPreview } from '@endfieldmap/map-service';
import { logger } from '@endfieldmap/tools';
import { Dialog } from '@endfieldmap/web-components';
import { BindIcon, EditIcon } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { UserModal } from '@/components/common/user/modal';
import { ActionPanel } from '@/components/features/user/info/action_panel';
import { BindUid } from '@/components/features/user/info/bind_uid';
import { Settings } from '@/components/features/user/info/settings';
import { SklandConflictDialog, type SklandConflictResolution } from '@/components/features/user/info/skland_conflict';
import { UidList } from '@/components/features/user/info/uid_list';
import { UserProfile } from '@/components/features/user/info/user_profile';
import { service } from '@/services';
import { catchErrorWithTip } from '@/utils/handler';

// ==================== 主组件 ====================
export const UserInfoModal = observer(({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [bindUidOpen, setBindUidOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sklandSyncing, setSklandSyncing] = useState(false);
  const [sklandPreview, setSklandPreview] = useState<SklandSyncPreview | null>(null);
  const { t } = useTranslation('header');

  const uidList = service.userService.auth.uidList;
  const uidInfo = service.userService.auth.currentUidInfo;
  const userInfo = service.userService.auth.userInfo;

  const handleDeleteUid = (uid: string) => {
    alert.confirm({
      content: t('user.uid.unbind_confirm'),
      onConfirm: async () => {
        catchErrorWithTip(async () => {
          await service.userService.unbindUid(uid);
        });
        return true;
      },
    });
  };

  const handleSwitchToUid = (uid: string) => {
    void catchErrorWithTip(() => service.userService.switchUid(uid));
  };

  const handleLogout = async () => {
    alert.confirm({
      content: t('user.logout_confirm'),
      onConfirm: async () => {
        alert.confirm({
          content: t('user.logout_confirm_clear_data'),
          dismissible: false,
          onConfirm: async () => {
            await service.userService.logout(false);
            return true;
          },
          onCancel: async () => {
            await service.userService.logout(true);
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

  // 第一步：只读比对，拉出两边差异后弹窗让用户逐方向选择。
  const handleSyncSkland = async () => {
    if (!uidInfo?.uid) {
      alert.info(t('user.skland.no_role'));
      return;
    }
    setSklandSyncing(true);
    try {
      const preview = await service.sklandSyncService.preview(uidInfo.uid);
      if (!preview.hasConflict) {
        alert.info(t('user.skland.inSync'));
        return;
      }
      setSklandPreview(preview);
    } catch (error) {
      logger.error('[UserInfoModal] skland preview failed', error);
      alert.info(t('user.skland.failed'));
    } finally {
      setSklandSyncing(false);
    }
  };

  // 第二步：按用户选择分别写本地 / 写森空岛。
  const handleResolveConflict = async (resolution: SklandConflictResolution) => {
    const preview = sklandPreview;
    if (!preview) return;
    setSklandSyncing(true);
    try {
      const sync = service.sklandSyncService;
      let localAdded = 0;
      let pushed = 0;
      let pushFailed = 0;

      if (resolution.remote === 'remote') {
        localAdded = sync.applyLocal(preview.remoteOnlyByMap, true);
      }
      if (resolution.local === 'local') {
        const result = await sync.pushRemote(preview.localOnlyByMap, true, preview.roleId);
        pushed = result.applied;
        pushFailed = result.failed;
      }

      setSklandPreview(null);
      if (pushFailed > 0) {
        alert.info(t('user.skland.conflict.pushFailed', { count: pushFailed }));
      } else {
        alert.info(t('user.skland.conflict.done', { localAdded, pushed }));
      }
    } catch (error) {
      logger.error('[UserInfoModal] skland resolve failed', error);
      alert.info(t('user.skland.failed'));
    } finally {
      setSklandSyncing(false);
    }
  };

  if (!userInfo) {
    return (
      <UserModal open={open} onClose={onClose} className="w-4xl" keyboardCloseable={!bindUidOpen && !settingsOpen}>
        <div className="flex gap-6 p-6 h-80 items-center justify-center">No User Info</div>
      </UserModal>
    );
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
          <ActionPanel
            onLogout={handleLogout}
            onBindUid={handleBindUid}
            onEditInfo={handleEditInfo}
            onSyncSkland={handleSyncSkland}
            syncSklandLoading={sklandSyncing}
          />
        </div>
      </UserModal>

      {/* 森空岛双向同步差异确认 */}
      <SklandConflictDialog
        open={sklandPreview !== null}
        preview={sklandPreview}
        loading={sklandSyncing}
        onResolve={handleResolveConflict}
        onCancel={() => setSklandPreview(null)}
      />

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
