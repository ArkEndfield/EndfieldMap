import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { StyledTextInput } from '@/components/ui/text-input';
import { alertApi } from '@/components/ui/alert';
import { service } from '@/services/map-service';
import { catchErrorWithTip, onFormInvalid } from '@/utils/error-handler';
import { cn } from '@/utils/style';
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '@/const/schema/auth';

type AuthTab = 'login' | 'register';

export default function LoginScreen() {
  const { t } = useTranslation(['header', 'error']);
  const [tab, setTab] = useState<AuthTab>('login');

  return (
    <>
      <Stack.Screen options={{ title: t('header:user.login') }} />
      <KeyboardAvoidingView
        className="flex-1 bg-bg-secondary"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-10 pt-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8 items-center">
            <Text className="text-2xl font-bold text-text-primary">Endfield Map</Text>
            <Text className="mt-2 text-sm text-text-muted">
              {t('header:user.auth_subtitle', { defaultValue: '登录以同步你的数据' })}
            </Text>
          </View>

          <TabSwitcher tab={tab} onTabChange={setTab} />

          {tab === 'login' ? (
            <LoginForm onSwitchToRegister={() => setTab('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setTab('login')} />
          )}

          <ThirdPartySection />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function TabSwitcher({ tab, onTabChange }: { tab: AuthTab; onTabChange: (t: AuthTab) => void }) {
  const { t } = useTranslation('header');

  return (
    <View className="mb-6 flex-row rounded-xl bg-bg-primary p-1">
      <Pressable
        className={cn('flex-1 items-center rounded-lg py-2.5', tab === 'login' && 'bg-primary')}
        onPress={() => onTabChange('login')}
      >
        <Text className={cn('text-sm font-semibold', tab === 'login' ? 'text-white' : 'text-text-muted')}>
          {t('user.login')}
        </Text>
      </Pressable>
      <Pressable
        className={cn('flex-1 items-center rounded-lg py-2.5', tab === 'register' && 'bg-primary')}
        onPress={() => onTabChange('register')}
      >
        <Text className={cn('text-sm font-semibold', tab === 'register' ? 'text-white' : 'text-text-muted')}>
          {t('user.register')}
        </Text>
      </Pressable>
    </View>
  );
}

function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { t } = useTranslation(['header', 'error']);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', agree: false },
  });

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      setLoading(true);
      const result = await catchErrorWithTip(() =>
        service.userService.login(data.username, data.password)
      );
      setLoading(false);
      if (result !== false) {
        router.back();
      }
    },
    [router]
  );

  return (
    <View>
      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <StyledTextInput
            label={t('header:user.username')}
            placeholder={t('header:user.username_placeholder')}
            value={value}
            onChangeText={onChange}
            error={error?.message ? t(`error:schema.${error.message}`, { defaultValue: error.message }) : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <StyledTextInput
            label={t('header:user.password')}
            placeholder={t('header:user.password_placeholder')}
            value={value}
            onChangeText={onChange}
            secureTextEntry
            error={error?.message ? t(`error:schema.${error.message}`, { defaultValue: error.message }) : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="agree"
        render={({ field: { onChange, value } }) => (
          <View className="mb-4 flex-row items-center">
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={value ? '#fff' : '#f4f3f4'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
            <Pressable onPress={() => setShowAgreement(true)}>
              <Text className="ml-1 text-xs text-text-muted">
                {t('header:user.agree_prefix', { defaultValue: '我已阅读并同意' })}
                <Text className="text-primary">
                  {t('header:user.agreement', { defaultValue: '《用户协议》' })}
                </Text>
              </Text>
            </Pressable>
          </View>
        )}
      />

      <Pressable
        className="items-center rounded-xl bg-primary py-3.5"
        onPress={handleSubmit(onSubmit, onFormInvalid)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">
            {t('header:user.login')}
          </Text>
        )}
      </Pressable>

      {showAgreement ? <AgreementSheet onClose={() => setShowAgreement(false)} /> : null}
    </View>
  );
}

function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { t } = useTranslation(['header', 'error']);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);

  const { control, handleSubmit } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', password: '', agree: false },
  });

  const onSubmit = useCallback(
    async (data: RegisterFormData) => {
      setLoading(true);
      const result = await catchErrorWithTip(() =>
        service.userService.register(data.username, data.password)
      );
      setLoading(false);
      if (result !== false) {
        router.back();
      }
    },
    [router]
  );

  return (
    <View>
      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <StyledTextInput
            label={t('header:user.username', { defaultValue: '用户名' })}
            placeholder={t('header:user.register_username_placeholder')}
            value={value}
            onChangeText={onChange}
            error={error?.message ? t(`error:schema.${error.message}`, { defaultValue: error.message }) : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <StyledTextInput
            label={t('header:user.password', { defaultValue: '密码' })}
            placeholder={t('header:user.register_password_placeholder')}
            value={value}
            onChangeText={onChange}
            secureTextEntry
            error={error?.message ? t(`error:schema.${error.message}`, { defaultValue: error.message }) : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="agree"
        render={({ field: { onChange, value } }) => (
          <View className="mb-4 flex-row items-center">
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={value ? '#fff' : '#f4f3f4'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
            <Pressable onPress={() => setShowAgreement(true)}>
              <Text className="ml-1 text-xs text-text-muted">
                {t('header:user.agree_prefix', { defaultValue: '我已阅读并同意' })}
                <Text className="text-primary">
                  {t('header:user.agreement', { defaultValue: '《用户协议》' })}
                </Text>
              </Text>
            </Pressable>
          </View>
        )}
      />

      <Pressable
        className="items-center rounded-xl bg-primary py-3.5"
        onPress={handleSubmit(onSubmit, onFormInvalid)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">
            {t('header:user.register')}
          </Text>
        )}
      </Pressable>

      {showAgreement ? <AgreementSheet onClose={() => setShowAgreement(false)} /> : null}
    </View>
  );
}

function AgreementSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('header');

  return (
    <View className="absolute inset-0 z-50 bg-black/50" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <View className="m-6 mt-20 max-h-[70%] rounded-2xl bg-bg-primary">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Text className="text-base font-semibold text-text-primary">
            {t('user.agreement_title', { defaultValue: '用户协议与隐私政策' })}
          </Text>
          <Pressable onPress={onClose}>
            <Text className="text-sm text-primary">
              {t('user.close', { defaultValue: '关闭' })}
            </Text>
          </Pressable>
        </View>
        <ScrollView className="px-4 py-3" contentContainerClassName="pb-4">
          <Text className="text-sm leading-5 text-text-secondary">
            {t('user.agreement_content', {
              defaultValue:
                '欢迎使用 Endfield Map 服务。使用本服务前，请您仔细阅读以下协议。\n\n' +
                '一、服务条款\n' +
                '本服务仅供个人非商业用途使用。您同意不会将本服务用于任何违法或未经授权的目的。\n\n' +
                '二、隐私政策\n' +
                '我们收集的信息包括：您的用户名、密码（加密存储）、游戏UID绑定信息。\n' +
                '我们不会向第三方出售或共享您的个人信息。\n\n' +
                '三、数据同步\n' +
                '您的地图标记数据将通过加密连接同步到服务器，用于跨设备访问。\n\n' +
                '四、免责声明\n' +
                '本服务为社区驱动的非官方工具，与游戏开发商无关。',
            })}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

function ThirdPartySection() {
  const { t } = useTranslation('header');

  const handleThirdParty = useCallback((provider: string) => {
    alertApi.info({
      content: t('user.third_party_unsupported', {
        defaultValue: '移动端暂不支持第三方登录',
      }),
    });
  }, [t]);

  return (
    <View className="mt-8">
      <View className="mb-4 flex-row items-center">
        <View className="h-px flex-1 bg-border" />
        <Text className="mx-3 text-xs text-text-muted">
          {t('user.use_third_part_login_tip')}
        </Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      <View className="flex-row justify-center gap-6">
        <ThirdPartyIcon label="QQ" color="#12B7F5" onPress={() => handleThirdParty('qq')} />
        <ThirdPartyIcon label="B站" color="#FB7299" onPress={() => handleThirdParty('bilibili')} />
        <ThirdPartyIcon label="DC" color="#5865F2" onPress={() => handleThirdParty('discord')} />
      </View>
    </View>
  );
}

function ThirdPartyIcon({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="h-12 w-12 items-center justify-center rounded-full"
      style={{ backgroundColor: color }}
      onPress={onPress}
    >
      <Text className="text-sm font-bold text-white">{label}</Text>
    </Pressable>
  );
}
