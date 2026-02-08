import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

import { cn } from '@/utils/style';

import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { alert } from '@/components/common/alert/alert_api';

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
        <p>请输入您的鹰角网络通行证 Token</p>
        <p className="text-xs text-gray-400 mt-1">如何获取</p>
      </div>

      {/* Token 输入框 */}
      <textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="请输入 hypergryph_token..."
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
        获取角色列表
      </ButtonWithAudio>
    </motion.div>
  );
};
