import { zodResolver } from '@hookform/resolvers/zod';
import { observer } from 'mobx-react-lite';
import { forwardRef, useImperativeHandle } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { alert } from '@/components/common/alert/alert_api';
import { KeyIcon } from '@/components/common/icons';
import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';
import { Input } from '@/components/common/input';
import { catchErrorWithTip, onFormInvalid } from '@/utils/handler';
import { useTranslation } from 'react-i18next';
import { changePasswordSchema } from '@/const/schema/auth';
import { userService } from '@/services/user';

type FormData = z.infer<typeof changePasswordSchema>;

export interface ChangePasswordFormRef {
  submit: () => Promise<boolean>;
}

const ChangePasswordForm = forwardRef<ChangePasswordFormRef>((_, ref) => {
  const { t } = useTranslation('header');
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    return !!(await catchErrorWithTip(() => userService.changePassword(data.oldPassword, data.newPassword)));
  };

  useImperativeHandle(ref, () => ({
    submit: async () => {
      let success = false;
      await handleSubmit(async (data) => {
        success = await onSubmit(data);
      }, onFormInvalid)();
      return success;
    },
  }));

  return (
    <div className="flex flex-col gap-4 min-w-75 pt-4">
      <Controller
        name="oldPassword"
        control={control}
        render={({ field: { onChange, ...field } }) => (
          <Input
            {...field}
            onValueChange={onChange}
            inputType="password"
            placeholder={t('user.info.password.old')}
            content={<div className="text-black/60 text-xs">{t('user.info.password.old')}</div>}
          />
        )}
      />

      <Controller
        name="newPassword"
        control={control}
        render={({ field: { onChange, ...field } }) => (
          <Input
            {...field}
            onValueChange={onChange}
            inputType="password"
            placeholder={t('user.info.password.new')}
            content={<div className="text-black/60 text-xs">{t('user.info.password.new')}</div>}
          />
        )}
      />

      <Controller
        name="confirmPassword"
        control={control}
        render={({ field: { onChange, ...field } }) => (
          <Input
            {...field}
            onValueChange={onChange}
            inputType="password"
            placeholder={t('user.info.password.confirm')}
            content={<div className="text-black/60 text-xs">{t('user.info.password.confirm')}</div>}
          />
        )}
      />
    </div>
  );
});

export const ChangePassword = observer(() => {
  const { t } = useTranslation('header');

  const handleClick = () => {
    let formRef: ChangePasswordFormRef | null = null;
    alert.confirm({
      width: '25rem',
      content: (
        <div className="flex flex-col gap-2">
          <div className="text-lg font-bold text-center mb-2">{t('user.info.password.edit')}</div>
          <ChangePasswordForm
            ref={(ref) => {
              formRef = ref;
            }}
          />
        </div>
      ),
      onConfirm: async () => {
        if (formRef) {
          return await formRef.submit();
        }
        return false;
      },
    });
  };

  return (
    <ZmdSquareButton type="primary" icon={<KeyIcon />} onClick={handleClick} className="flex-2 text-base py-2">
      {t('user.info.password.edit')}
    </ZmdSquareButton>
  );
});
