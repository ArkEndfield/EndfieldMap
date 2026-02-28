import { useTranslation } from '@endfieldmap/map-service';
import { motion } from 'motion/react';
import { useCallback, useState } from 'react';

import { BilibiliIcon, DiscordIcon, Logo, QQIcon } from '@endfieldmap/web-components';
import { UserModal } from '@/components/common/user/modal';
import { LoginForm } from '@/components/features/user/login/login';
import { RegisterForm } from '@/components/features/user/login/register';
import { ThirdPartyButton } from '@/components/features/user/login/third_party';

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

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
  };

  // 重置状态的函数
  const resetState = useCallback(() => {
    setMode('login');
  }, []);

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
          <motion.div className="flex w-[200%]" animate={{ x: slideX }} transition={slideTransition}>
            {/* 登录表单 */}
            <div className="w-1/2 space-y-4 px-0.5">
              <LoginForm onSwitchToRegister={() => switchMode('register')} />
            </div>
            {/* 注册表单 */}
            <div className="w-1/2 space-y-4 px-0.5">
              <RegisterForm onSwitchToLogin={() => switchMode('login')} />
            </div>
          </motion.div>

          {/* 第三方登录分割线 */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
            <span className="text-white/50 text-xs">
              {t('user.third_party_login', {
                defaultValue:
                  mode === 'login' ? t('user.use_third_part_login_tip') : t('user.use_third_part_register_tip'),
              })}
            </span>
            <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/30 to-transparent" />
          </div>

          {/* 第三方登录按钮 */}
          <div className="flex gap-3 justify-center">
            <ThirdPartyButton icon={<QQIcon className="text-[#12B7F5]" />} label="QQ" />
            <ThirdPartyButton icon={<BilibiliIcon className="text-[#FB7299]" />} label="Bilibili" />
            <ThirdPartyButton icon={<DiscordIcon className="text-[#5865F2]" />} label="Discord" />
          </div>
        </div>
      </div>
    </UserModal>
  );
};
