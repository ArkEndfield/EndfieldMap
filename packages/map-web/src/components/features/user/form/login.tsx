import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';
import { TickCircleIcon } from '@/components/common/icons';
import { Toggle } from '@/components/common/toggle';
import { UserInput } from '@/components/common/user/input';

interface LoginFormProps {
  isAgree: boolean;
  onAgreeChange: (agree: boolean) => void;
  onSwitchToRegister: () => void;
  LinkButton: React.ComponentType<{ children?: React.ReactNode; href: string }>;
}

export const LoginForm = ({
  isAgree,
  onAgreeChange,
  onSwitchToRegister,
  LinkButton,
}: LoginFormProps) => {
  const { t } = useTranslation('header');

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [accountError, setAccountError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, _setLoading] = useState(false);

  const onLogin = async () => {
    alert.info(t('user.not_support_yet'));
  };

  return (
    <>
      <UserInput
        label={t('user.username')}
        placeholder={t('user.username_placeholder')}
        value={account}
        onChange={(val) => {
          setAccount(val);
          setAccountError('');
        }}
        error={!!accountError}
      />
      <UserInput
        label={t('user.password')}
        placeholder={t('user.password_placeholder')}
        type="password"
        value={password}
        onChange={(val) => {
          setPassword(val);
          setPasswordError('');
        }}
        error={!!passwordError}
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
};
