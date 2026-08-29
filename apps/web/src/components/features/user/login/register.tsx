import { CheckboxToggle, ZmdSquareButton } from '@endfieldmap/web-components';
import { TickCircleIcon } from '@endfieldmap/web-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { UserInput } from '@/components/common/user/input';
import { type RegisterFormData, registerSchema } from '@/const/schema/auth';
import { service } from '@/services';
import { catchErrorWithTip, onFormInvalid } from '@/utils/handler';

import { AgreementDialog, AgreementLink } from './agreement';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm = observer(({ onSwitchToLogin }: RegisterFormProps) => {
  const { t } = useTranslation('header');
  const [loading, setLoading] = useState(false);
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
  const [agreementType, setAgreementType] = useState<'agreement' | 'privacy'>('agreement');

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
    await catchErrorWithTip(() => service.userService.register(data.username, data.password));
    setLoading(false);
  }, onFormInvalid);

  const handleOpenAgreement = (type: 'agreement' | 'privacy') => {
    setAgreementType(type);
    setAgreementDialogOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-[auto_1fr] gap-y-2">
        <Controller
          name="username"
          control={control}
          render={({ field }) => (
            <UserInput
              label={t('user.username')}
              placeholder={t('user.register_username_placeholder')}
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
              placeholder={t('user.register_password_placeholder')}
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
          <CheckboxToggle
            checked={field.value}
            onToggle={() => field.onChange(!field.value)}
            label={
              <div className="flex flex-wrap items-center gap-1 justify-center">
                <AgreementLink onClick={handleOpenAgreement} />
              </div>
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
        {t('user.register_submit')}
      </ZmdSquareButton>

      {/* 返回登录 */}
      <div className="text-center">
        <button onClick={onSwitchToLogin} className="text-white/60 hover:text-white text-sm transition-colors">
          {t('user.back_to_login')}
        </button>
      </div>

      <AgreementDialog open={agreementDialogOpen} onClose={() => setAgreementDialogOpen(false)} type={agreementType} />
    </>
  );
});
