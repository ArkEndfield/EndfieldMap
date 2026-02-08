import { zodResolver } from '@hookform/resolvers/zod';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';
import { TickCircleIcon } from '@/components/common/icons';
import { Toggle } from '@/components/common/toggle';
import { UserInput } from '@/components/common/user/input';
import { type LoginFormData, loginSchema } from '@/const/schema/auth';
import { userService } from '@/services/user';
import { catchErrorWithTip, onFormInvalid } from '@/utils/handler';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  LinkButton: React.ComponentType<{ children?: React.ReactNode; href: string }>;
}

export const LoginForm = observer(({ onSwitchToRegister, LinkButton }: LoginFormProps) => {
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
      agree: false,
    },
  });

  const onLogin = handleSubmit(async (data) => {
    setLoading(true);
    await catchErrorWithTip(() => userService.login(data.username, data.password));
    setLoading(false);
  }, onFormInvalid);

  return (
    <>
      <div className="grid grid-cols-[auto_1fr] gap-y-2">
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
      </div>
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
