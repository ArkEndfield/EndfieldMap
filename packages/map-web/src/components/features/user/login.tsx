import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { BilibiliIcon, DiscordIcon, Logo, QQIcon } from '@/components/common/icons';
import { UserModal } from '@/components/common/user/modal';
import { LoginForm } from '@/components/features/user/form/login';
import { RegisterForm } from '@/components/features/user/form/register';
import { isDev } from '@/services/env';
import { cn } from '@/utils/style';

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
    <span className="text-lg">{icon}</span>
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

type AuthMode = 'login' | 'register';

// 动画配置
const slideTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

export const LoginModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation('header');
  const [mode, setMode] = useState<AuthMode>('login');

  const [isAgree, setIsAgree] = useState(false);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
  };

  // 重置状态的函数
  const resetState = useCallback(() => {
    setMode('login');
    setIsAgree(false);
  }, []);

  useEffect(() => {
    // TODO: 先做不支持的提示
    if (open && !isDev) alert.info(t('user.not_support_yet'));
  }, [open, t]);

  // 处理关闭时重置状态
  const handleClose = useCallback(() => {
    onClose();
    // 延迟重置状态，确保动画完成后再重置
    setTimeout(resetState, 300);
  }, [onClose, resetState]);

  // 计算滑动偏移量：login 为 0%，register 为 -50%（因为容器宽度是200%，移动50%即显示第二个表单）
  const slideX = mode === 'login' ? '0%' : '-50%';

  return (
    <UserModal open={open} onClose={handleClose}>
      <div className="mb-10 w-80 max-w-full mx-auto flex flex-col items-center">
        <Logo className="h-10 my-10" />
        <div className="w-full space-y-4 overflow-hidden">
          {/* 表单滑动容器 */}
          <motion.div
            className="flex w-[200%]"
            animate={{ x: slideX }}
            transition={slideTransition}
          >
            {/* 登录表单 */}
            <div className="w-1/2 space-y-4 px-0.5">
              <LoginForm
                isAgree={isAgree}
                onAgreeChange={setIsAgree}
                onSwitchToRegister={() => switchMode('register')}
                LinkButton={LinkButton}
              />
            </div>
            {/* 注册表单 */}
            <div className="w-1/2 space-y-4 px-0.5">
              <RegisterForm
                isAgree={isAgree}
                onAgreeChange={setIsAgree}
                onSwitchToLogin={() => switchMode('login')}
                LinkButton={LinkButton}
              />
            </div>
          </motion.div>

          {/* 第三方登录分割线 */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
            <span className="text-white/50 text-xs">
              {t('user.third_party_login', {
                defaultValue: mode === 'login' ? '或使用以下方式登录' : '或使用以下方式注册',
              })}
            </span>
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
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
            <ThirdPartyButton
              icon={<DiscordIcon className="text-[#5865F2]" />}
              label="Discord"
              onClick={() => alert.info(t('user.not_support_yet'))}
            />
          </div>
        </div>
      </div>
    </UserModal>
  );
};
