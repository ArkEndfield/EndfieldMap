import React, { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { StyledTextInput } from '@/components/ui/text-input';
import { alertApi } from '@/components/ui/alert';
import { service } from '@/services/map-service';
import { catchErrorWithTip, onFormInvalid } from '@/utils/error-handler';
import { changePasswordSchema, type ChangePasswordFormData } from '@/const/schema/auth';

export default function ChangePasswordScreen() {
  const { t } = useTranslation(['header', 'error']);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = useCallback(
    async (data: ChangePasswordFormData) => {
      setLoading(true);
      const result = await catchErrorWithTip(() =>
        service.userService.changePassword(data.oldPassword, data.newPassword)
      );
      setLoading(false);
      if (result !== false) {
        alertApi.info({
          content: t('header:user.password_changed', {
            defaultValue: '密码修改成功，请重新登录',
          }),
        });
        router.dismissAll();
      }
    },
    [router, t]
  );

  return (
    <>
      <Stack.Screen
        options={{ title: t('header:user.info.password.edit') }}
      />
      <KeyboardAvoidingView
        className="flex-1 bg-bg-secondary"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-10 pt-6"
          keyboardShouldPersistTaps="handled"
        >
          <Controller
            control={control}
            name="oldPassword"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <StyledTextInput
                label={t('header:user.info.password.old')}
                placeholder={t('header:user.old_password_placeholder', { defaultValue: '请输入旧密码' })}
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={
                  error?.message
                    ? t(`error:schema.${error.message}`, { defaultValue: error.message })
                    : undefined
                }
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <StyledTextInput
                label={t('header:user.info.password.new')}
                placeholder={t('header:user.new_password_placeholder', { defaultValue: '至少6位' })}
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={
                  error?.message
                    ? t(`error:schema.${error.message}`, { defaultValue: error.message })
                    : undefined
                }
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <StyledTextInput
                label={t('header:user.info.password.confirm')}
                placeholder={t('header:user.confirm_password_placeholder', {
                  defaultValue: '请再次输入新密码',
                })}
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={
                  error?.message
                    ? t(`error:schema.${error.message}`, { defaultValue: error.message })
                    : undefined
                }
              />
            )}
          />

          <Pressable
            className="mt-4 items-center rounded-xl bg-primary py-3.5"
            onPress={handleSubmit(onSubmit, onFormInvalid)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                {t('header:user.confirm_change', { defaultValue: '确认修改' })}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
