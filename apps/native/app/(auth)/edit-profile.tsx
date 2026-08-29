import { Stack, useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

import { alertApi } from '@/components/ui/alert';
import { StyledTextInput } from '@/components/ui/text-input';
import { service } from '@/services/map-service';
import { catchErrorWithTip } from '@/utils/error-handler';

export default observer(function EditProfileScreen() {
  const { t } = useTranslation('header');
  const router = useRouter();
  const currentNickname = service.userService.auth.userInfo?.nickname ?? '';
  const [nickname, setNickname] = useState(currentNickname);
  const [loading, setLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!nickname.trim()) {
      alertApi.info({
        content: t('user.nickname_empty', { defaultValue: '昵称不能为空' }),
      });
      return;
    }
    setLoading(true);
    const result = await catchErrorWithTip(() =>
      service.userService.changeNickname(nickname.trim())
    );
    setLoading(false);
    if (result !== false) {
      alertApi.info({
        content: t('user.info.nickname.edit_success'),
      });
      router.back();
    }
  }, [nickname, router, t]);

  return (
    <>
      <Stack.Screen options={{ title: t('user.info.edit') }} />
      <KeyboardAvoidingView
        className="flex-1 bg-bg-secondary"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6 pt-6">
          <StyledTextInput
            label={t('user.nickname')}
            placeholder={t('user.info.nickname.edit_tip')}
            value={nickname}
            onChangeText={setNickname}
          />

          <Pressable
            className="mt-4 items-center rounded-xl bg-primary py-3.5"
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                {t('user.save', { defaultValue: '保存' })}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
});
