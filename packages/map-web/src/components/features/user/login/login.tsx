import { zodResolver } from '@hookform/resolvers/zod';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Controller, type FieldErrors, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';
import { TickCircleIcon } from '@/components/common/icons';
import { Toggle } from '@/components/common/toggle';
import { UserInput } from '@/components/common/user/input';
import { type LoginFormData, loginSchema } from '@/const/schema/auth';
import { userService } from '@/services/user';

interface LoginFormProps {
  isAgree: boolean;
  onAgreeChange: (agree: boolean) => void;
  onSwitchToRegister: () => void;
  LinkButton: React.ComponentType<{ children?: React.ReactNode; href: string }>;
}

export const LoginForm = observer(({ isAgree, onAgreeChange, onSwitchToRegister, LinkButton }: LoginFormProps) => {
  const { t } = useTranslation('header');
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onInvalid = (errors: FieldErrors<LoginFormData>) => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      alert.info(firstError.message);
    }
  };

  const onLogin = handleSubmit(async (data) => {
    setLoading(true);
    try {
      await userService.auth.login(data.username, data.password);
      // alert.info(t('user.not_support_yet'));
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert.info(t(error.message, {
          defaultValue: error.message,
        }));
      } else {
        alert.info(t('user.unknown_error', {
          defaultValue: '未知错误',
        }));
      }
    } finally {
      setLoading(false);
    }
  }, onInvalid);

  return (
    <>
      <Controller
        name="username"
        control={control}
        render={({ field }) => (
          <UserInput
            label={t('user.username')}
            placeholder={t('user.username_placeholder')}
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
            placeholder={t('user.password_placeholder')}
            type="password"
            value={field.value}
            onChange={field.onChange}
            error={!!errors.password}
          />
        )}
      />
      <Toggle
        checked={isAgree}
        onToggle={() => onAgreeChange(!isAgree)}
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
      <div className="flex gap-2">
        <ZmdSquareButton className="text-base" loading={loading} onClick={onSwitchToRegister}>
          {t('user.register')}
        </ZmdSquareButton>
        <ZmdSquareButton
          className="flex-1 text-base"
          type="default"
          icon={<TickCircleIcon />}
          loading={loading}
          onClick={onLogin}
        >
          {t('user.login')}
        </ZmdSquareButton>
      </div>
    </>
  );
});
