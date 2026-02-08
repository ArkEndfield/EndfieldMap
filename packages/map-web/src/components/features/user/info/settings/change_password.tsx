import { zodResolver } from '@hookform/resolvers/zod';
import { observer } from 'mobx-react-lite';
import { forwardRef, useImperativeHandle } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { alert } from '@/components/common/alert/alert_api';
import { KeyIcon } from '@/components/common/icons';
import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';
import { Input } from '@/components/common/input';
import { onFormInvalid } from '@/utils/handler';

const schema = z
  .object({
    oldPassword: z.string().min(1, '请输入旧密码'),
    newPassword: z.string().min(6, '新密码至少6位'),
    confirmPassword: z.string().min(1, '请确认新密码'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export interface ChangePasswordFormRef {
  submit: () => Promise<boolean>;
}

const ChangePasswordForm = forwardRef<ChangePasswordFormRef>((_, ref) => {
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    // TODO: 调用修改密码接口
    console.log(data);
    alert.info('修改密码功能暂未开放');
    return true;
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
            placeholder="旧密码"
            content={<div className="text-black/60 text-xs">旧密码</div>}
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
            placeholder="新密码"
            content={<div className="text-black/60 text-xs">新密码</div>}
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
            placeholder="确认新密码"
            content={<div className="text-black/60 text-xs">确认新密码</div>}
          />
        )}
      />
    </div>
  );
});

export const ChangePassword = observer(() => {
  const handleClick = () => {
    let formRef: ChangePasswordFormRef | null = null;
    alert.confirm({
      width: '25rem',
      content: (
        <div className="flex flex-col gap-2">
          <div className="text-lg font-bold text-center mb-2">修改密码</div>
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
      修改密码
    </ZmdSquareButton>
  );
});
