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
import { cn } from '@/utils/style';

// QQ 图标
const QQIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={cn('w-4 h-4', className)}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14.5c-.3.5-.8.7-1.3.5-.2-.1-1-.5-1.7-.7-.3.4-.7.7-1.1.9-.5.3-1 .4-1.5.4s-1-.1-1.5-.4c-.4-.2-.8-.5-1.1-.9-.7.2-1.5.6-1.7.7-.5.2-1 0-1.3-.5-.2-.4-.1-.9.3-1.1.1-.1.8-.4 1.5-.7-.1-.3-.2-.6-.2-1 0-.3 0-.6.1-.9-.8-.4-1.4-.8-1.5-.9-.4-.3-.5-.8-.2-1.2.3-.4.8-.5 1.2-.2.1.1.5.4 1.1.7.4-.5.9-.9 1.5-1.2.7-.4 1.5-.6 2.3-.6s1.6.2 2.3.6c.6.3 1.1.7 1.5 1.2.6-.3 1-.6 1.1-.7.4-.3.9-.2 1.2.2.3.4.2.9-.2 1.2-.1.1-.7.5-1.5.9.1.3.1.6.1.9 0 .4-.1.7-.2 1 .7.3 1.4.6 1.5.7.4.2.5.7.3 1.1z" />
  </svg>
);

// Bilibili 图标
const BilibiliIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={cn('w-4 h-4', className)}>
    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" />
  </svg>
);

// 第三方登录按钮
const ThirdPartyButton = ({
  icon,
  label,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded',
      'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30',
      'text-white/90 hover:text-white text-xs font-medium',
      'transition-all duration-200 ease-out',
      'backdrop-blur-sm',
      className
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

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
            <ZmdSquareButton className="text-base" loading={loading} onClick={onLogin}>
              {t('user.register')}
            </ZmdSquareButton>
            <ZmdSquareButton className="flex-1 text-base" type="default" icon={<TickCircleIcon />} loading={loading} onClick={onLogin}>
              {t('user.login')}
            </ZmdSquareButton>
          </div>

          {/* 第三方登录分割线 */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <span className="text-white/50 text-xs">{t('user.third_party_login', '或使用以下方式登录')}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>

          {/* 第三方登录按钮 */}
          <div className="flex gap-3 justify-center">
            <ThirdPartyButton
              icon={<QQIcon className="text-[#12B7F5]" />}
              label="QQ"
              onClick={() => alert.info(t('user.not_support_yet'))}
            />
            <ThirdPartyButton
              icon={<BilibiliIcon className="text-[#FB7299]" />}
              label="Bilibili"
              onClick={() => alert.info(t('user.not_support_yet'))}
            />
          </div>
        </div>
      </div>
    </UserModal>
  );
};
