import { Logo } from '@/components/common/icons';
import { UserModal } from '@/components/common/user/modal';
import { UserInput } from '@/components/common/user/input';
import { Toggle } from '@/components/common/toggle';
import { alert } from '@/components/common/alert/alert_api';

import { useState, useEffect } from 'react';
import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';
import { TickCircleIcon } from '@/components/common/icons';
import { Trans, useTranslation } from 'react-i18next';
import { isDev } from '@/services/env';

const LinkButton = ({ children, href }: { children?: React.ReactNode; href: string }) => {
  return (
    <a
      href={href}
      className="border-b border-transparent hover:border-[#FDFB73] text-[#FDFB73] hover:text-[#FDFB73] transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  );
};

export const LoginModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation('header');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [accountError, setAccountError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isAgree, setIsAgree] = useState(false);
  const [loading, _setLoading] = useState(false);
  const onLogin = async () => {
    alert.info(t('user.not_support_yet'));
  };
  useEffect(() => {
    // TODO: 先做不支持的提示
    if (open && !isDev) onLogin();
  }, [open]);
  return (
    <UserModal open={open} onClose={onClose}>
      <div className="mb-10 w-80 max-w-full mx-auto flex flex-col items-center">
        <Logo className="h-10 my-10" />
        <div className="w-full space-y-4">
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
            value={password}
            onChange={(val) => {
              setPassword(val);
              setPasswordError('');
            }}
            error={!!passwordError}
          />
          <Toggle
            checked={isAgree}
            onToggle={() => setIsAgree(!isAgree)}
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
            <ZmdSquareButton className="flex-1 text-base" icon={<TickCircleIcon />} loading={loading} onClick={onLogin}>
              {t('user.login')}
            </ZmdSquareButton>
            <ZmdSquareButton type="default" className="text-base" loading={loading} onClick={onLogin}>
              {t('user.register')}
            </ZmdSquareButton>
          </div>
        </div>
      </div>
    </UserModal>
  );
};
