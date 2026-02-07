import { useState } from 'react';
import { motion } from 'motion/react';

import { serverService } from '@/services/server';
import { catchErrorWithTip } from '@/utils/handler';
import { cn } from '@/utils/style';

import type { GameRole } from '@/@types/game_role';
import { ButtonWithAudio } from '@/components/common/button_with_audio';

interface TokenLoginProps {
  /** 登录成功回调，返回可绑定的角色列表 */
  onLogin: (roles: GameRole[]) => void;
  /** 加载状态变化回调 */
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * Token 登录组件
 * 用户输入鹰角 Token 获取可绑定的游戏角色列表
 */
export const TokenLogin = ({ onLogin, onLoadingChange }: TokenLoginProps) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token.trim() || loading) return;

    setLoading(true);
    onLoadingChange?.(true);

    const result = await catchErrorWithTip(async () => {
      const response = await serverService.apiPost<{ roles: GameRole[] }>('/user/game-roles/bindable', {
        hypergryph_token: token.trim(),
      });
      return response?.roles ?? [];
    });

    setLoading(false);
    onLoadingChange?.(false);

    if (result && result.length >= 0) {
      onLogin(result);
    }
  };

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
          'w-full h-24 p-3 text-sm resize-none',
          'bg-gray-100 border border-gray-300 rounded',
          'focus:outline-none focus:border-[#FDFB73] focus:ring-1 focus:ring-[#FDFB73]/50',
          'placeholder:text-gray-400'
        )}
        disabled={loading}
      />

      {/* 提交按钮 */}
      <ButtonWithAudio
        onClick={handleSubmit}
        disabled={!token.trim() || loading}
        className={cn(
          'w-full py-2.5 text-sm font-medium rounded transition-all',
          token.trim() && !loading
            ? 'bg-[#363636] text-[#FDFB73] hover:bg-[#484848]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        )}
      >
        {loading ? '获取中...' : '获取角色列表'}
      </ButtonWithAudio>
    </motion.div>
  );
};
