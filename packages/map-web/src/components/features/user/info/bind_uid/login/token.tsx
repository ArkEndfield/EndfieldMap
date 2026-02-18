import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from '@endfieldmap/map-service';

import { alert } from '@/components/common/alert/alert_api';
import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { cn } from '@/utils/style';

interface TokenLoginProps {
  /** 登录成功回调，返回 token */
  onLogin: (token: string) => void;
  /** 错误信息 */
  errorMessage: string | null;
}

/**
 * Token 登录组件
 * 用户输入鹰角 Token 获取可绑定的游戏角色列表
 */
export const TokenLogin = ({ onLogin, errorMessage }: TokenLoginProps) => {
  const [token, setToken] = useState('');
  const { t } = useTranslation('header');

  const handleSubmit = () => {
    if (!token.trim()) return;
    onLogin(token.trim());
  };

  useEffect(() => {
    if (errorMessage) {
      alert.info(errorMessage);
    }
  }, [errorMessage]);

  return (
    <motion.div
      className="flex flex-col gap-4 p-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* 说明文字 */}
      <div className="text-sm text-gray-600">
        <p>{t('user.uid.token.tip')}</p>
        <p className="text-xs text-gray-400 mt-1">{t('user.uid.token.how_to_get')}</p>
      </div>

      {/* Token 输入框 */}
      <textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder={t('user.uid.token.placeholder')}
        className={cn(
          'w-full h-24 p-3 text-sm resize-none outline-none transition-all duration-200',
          'bg-[#e8e6e6] text-[#2a2728] placeholder-[#a0a2a3]',
          'rounded-lg',
          'shadow-[inset_0_0_3px_#b9b9b9]',
          'hover:bg-[#f0f0f0] hover:shadow-[inset_0_0_0_1px_#fefefe,0_0_4px_rgba(0,0,0,0.3)]',
          'active:bg-[#cfcdcd] active:shadow-[inset_0_0_3px_#b9b9b9]',
          'focus:bg-[#e8e6e6] focus:shadow-[inset_0_0_3px_#b9b9b9]'
        )}
      />

      {/* 提交按钮 */}
      <ButtonWithAudio
        onClick={handleSubmit}
        disabled={!token.trim()}
        className={cn(
          'w-full py-2.5 text-sm font-medium rounded transition-all',
          token.trim()
            ? 'bg-[#363636] text-[#FDFB73] hover:bg-[#484848]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        )}
      >
        {t('user.uid.token.submit')}
      </ButtonWithAudio>
    </motion.div>
  );
};
