import { zodResolver } from '@hookform/resolvers/zod';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';
import { TickCircleIcon } from '@/components/common/icons';
import { Toggle } from '@/components/common/toggle';
import { UserInput } from '@/components/common/user/input';
import { type RegisterFormData, registerSchema } from '@/const/schema/auth';
import { userService } from '@/services/user';
import { catchErrorWithTip, onFormInvalid } from '@/utils/handler';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  LinkButton: React.ComponentType<{ children?: React.ReactNode; href: string }>;
}

export const RegisterForm = observer(({ onSwitchToLogin, LinkButton }: RegisterFormProps) => {
  const { t } = useTranslation('header');
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      agree: false,
    },
  });

  const onRegister = handleSubmit(async (data) => {
    setLoading(true);
    await catchErrorWithTip(() => userService.register(data.username, data.password));
    setLoading(false);
  }, onFormInvalid);

  return (
    <>
      <Controller
        name="username"
        control={control}
        render={({ field }) => (
          <UserInput
            label={t('user.username')}
            placeholder={t('user.register_username_placeholder', '请输入用户名（3-20个字符）')}
            value={field.value}
            onChange={field.onChange}
            error={!!errors.username}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <UserInput
            label={t('user.password')}
            placeholder={t('user.register_password_placeholder', '请输入密码（至少6个字符）')}
            type="password"
            value={field.value}
            onChange={field.onChange}
            error={!!errors.password}
          />
        )}
      />

      <Controller
        name="agree"
        control={control}
        render={({ field }) => (
          <Toggle
            checked={field.value}
            onToggle={() => field.onChange(!field.value)}
            label={
              <Trans
                t={t}
                i18nKey="user.agreement"
                components={{
                  agreement: <LinkButton href="" />,
                }}
              />
            }
            hideBorder
            size="sm"
            className="gap-1 mx-auto bg-black/20 py-1 px-4 rounded-full [text-shadow:0_2px_2px_rgba(0,0,0,0.8)]"
          />
        )}
      />

      <ZmdSquareButton
        className="w-full text-base"
        type="default"
        icon={<TickCircleIcon />}
        loading={loading}
        onClick={onRegister}
      >
        {t('user.register_submit', '立即注册')}
      </ZmdSquareButton>

      {/* 返回登录 */}
      <div className="text-center">
        <button onClick={onSwitchToLogin} className="text-white/60 hover:text-white text-sm transition-colors">
          {t('user.back_to_login', '已有账号？返回登录')}
        </button>
      </div>
    </>
  );
});
