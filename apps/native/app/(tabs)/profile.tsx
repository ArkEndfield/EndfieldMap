import { ApiError } from '@endfieldmap/map-service/service/api_error';
import { cn } from '@endfieldmap/tools';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { SyncBadge } from '@/components/features/user/sync-badge';
import { UidListItem } from '@/components/features/user/uid-list-item';
import { UserAvatar } from '@/components/features/user/user-avatar';
import { alertApi } from '@/components/ui/alert';
import { service } from '@/services/map-service';
import { catchErrorWithTip } from '@/utils/error-handler';

export default observer(function ProfileScreen() {
  const { isLogin } = service.userService.auth;

  if (!isLogin) {
    return <NotLoggedIn />;
  }

  return (
    <ScrollView className="flex-1 bg-bg-secondary" contentContainerClassName="pb-10 pt-[60px]">
      <UserSection />
      <UidSection />
      <ActionSection />
    </ScrollView>
  );
});

function NotLoggedIn() {
  const { t } = useTranslation('header');
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg-secondary pt-[60px]">
      <View className="items-center px-5 py-10">
        <UserAvatar size="lg" />
        <Pressable className="mt-4" onPress={() => router.push('/login')}>
          <Text className="text-lg font-semibold text-primary">
            {t('user.login')}
          </Text>
        </Pressable>
        <Text className="mt-2 text-sm text-text-muted">
          {t('user.sync.no_uid_tip')}
        </Text>
      </View>

      <SettingsEntry />
    </View>
  );
}

const UserSection = observer(function UserSection() {
  const { t } = useTranslation('header');
  const { userInfo, currentUidInfo, currentUid } = service.userService.auth;
  const [syncing, setSyncing] = React.useState(false);
  const hasUid = !!currentUid.value;

  const handleSync = useCallback(async () => {
    setSyncing(true);
    await catchErrorWithTip(() => service.userService.triggerSync());
    setSyncing(false);
  }, []);

  const currentUidLabel = currentUidInfo
    ? currentUidInfo.is_default
      ? t('user.uid.default')
      : `UID ${currentUidInfo.uid}`
    : t('user.uid.not_bind');

  return (
    <View className="mx-4 mb-4 rounded-2xl bg-bg-primary p-4">
      <View className="flex-row items-center">
        <UserAvatar uri={currentUidInfo?.avatar} size="lg" />
        <View className="ml-4 flex-1">
          <Text className="text-lg font-bold text-text-primary">
            {userInfo?.nickname || userInfo?.username || ''}
          </Text>
          <Text className="mt-1 text-sm text-text-muted">{currentUidLabel}</Text>
          {hasUid && (
            <View className="mt-1.5">
              <SyncBadge />
            </View>
          )}
        </View>
      </View>

      {hasUid && (
        <Pressable
          className="mt-4 items-center rounded-lg bg-primary/10 py-2.5"
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text className="text-sm font-semibold text-primary">
              {t('user.sync.start_now')}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
});

const UidSection = observer(function UidSection() {
  const { t } = useTranslation('header');
  const { uidList, currentUid } = service.userService.auth;

  const handleSwitch = useCallback(async (uid: string) => {
    await catchErrorWithTip(() => service.userService.switchUid(uid));
  }, []);

  const handleUnbind = useCallback(async (uid: string) => {
    const confirmed = await alertApi.confirm({
      content: t('user.uid.unbind_confirm'),
    });
    if (confirmed) {
      await catchErrorWithTip(() => service.userService.unbindUid(uid));
    }
  }, [t]);

  return (
    <View className="mx-4 mb-4">
      <Text className="mb-2 text-base font-semibold text-text-primary">
        {t('user.uid.list')}
      </Text>

      {uidList.length === 0 ? (
        <View className="items-center rounded-xl bg-bg-primary py-6">
          <Text className="text-sm text-text-muted">
            {t('user.uid.not_bind')}
          </Text>
        </View>
      ) : (
        uidList.map((uid) => (
          <UidListItem
            key={uid.uid}
            uid={uid}
            isActive={uid.uid === currentUid.value}
            onSwitch={handleSwitch}
            onUnbind={handleUnbind}
          />
        ))
      )}
    </View>
  );
});

const ActionSection = observer(function ActionSection() {
  const { t } = useTranslation('header');
  const router = useRouter();

  const handleEditProfile = useCallback(() => {
    router.push('/edit-profile');
  }, [router]);

  const handleChangePassword = useCallback(() => {
    router.push('/change-password');
  }, [router]);

  const handleDeleteAccount = useCallback(async () => {
    const confirmed = await alertApi.confirm({
      content: t('user.remove_account.confirm'),
      dismissible: false,
    });
    if (confirmed) {
      await catchErrorWithTip(async () => {
        try {
          await service.userService.deleteAccount();
        } catch (error) {
          // 服务端 step-up：有密码账号需输入密码，第三方登录账号需最近重新登录
          if (error instanceof ApiError && error.code === 'PASSWORD_REQUIRED') {
            const password = await alertApi.prompt({
              content: t('user.remove_account.password_required'),
              secure: true,
            });
            if (!password) return;
            await service.userService.deleteAccount(password);
          } else if (error instanceof ApiError && error.code === 'RECENT_LOGIN_REQUIRED') {
            alertApi.info({ content: t('user.remove_account.relogin_required') });
            return;
          } else {
            throw error;
          }
        }
        alertApi.info({
          content: t('user.remove_account.success'),
        });
      });
    }
  }, [t]);

  const handleLogout = useCallback(async () => {
    const confirmed = await alertApi.confirm({
      content: t('user.logout_confirm'),
    });
    if (!confirmed) return;

    const clearData = await alertApi.confirm({
      content: t('user.logout_confirm_clear_data'),
    });
    await catchErrorWithTip(() => service.userService.logout(!clearData));
  }, [t]);

  return (
    <View className="mx-4 gap-2">
      <ActionButton
        label={t('user.uid.bind')}
        onPress={() => router.push('/bind-uid')}
      />
      <ActionButton
        label={t('user.info.edit')}
        onPress={handleEditProfile}
      />
      <ActionButton
        label={t('user.info.password.edit')}
        onPress={handleChangePassword}
      />
      <ActionButton
        label={t('user.remove_account.title')}
        variant="danger"
        onPress={handleDeleteAccount}
      />
      <ActionButton
        label={t('user.logout')}
        variant="danger"
        onPress={handleLogout}
      />

      <View className="mt-2">
        <SettingsEntry />
      </View>
    </View>
  );
});

function ActionButton({
  label,
  variant = 'default',
  onPress,
}: {
  label: string;
  variant?: 'default' | 'danger';
  onPress: () => void;
}) {
  const isDanger = variant === 'danger';

  return (
    <Pressable
      className={cn('rounded-xl px-4 py-3.5', isDanger ? 'bg-error/10' : 'bg-bg-primary')}
      onPress={onPress}
    >
      <Text className={cn('text-[15px] font-medium', isDanger ? 'text-error' : 'text-text-primary')}>
        {label}
      </Text>
    </Pressable>
  );
}

function SettingsEntry() {
  const { t } = useTranslation('header');
  const router = useRouter();

  return (
    <Pressable
      className="mx-4 rounded-xl bg-bg-primary px-4 py-3.5"
      onPress={() => router.push('/settings')}
    >
      <Text className="text-[15px] font-medium text-text-primary">
        {t('settings.title')}
      </Text>
    </Pressable>
  );
}
