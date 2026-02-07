import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { cn } from '@/utils/style';

import type { GameRole } from '@/@types/game_role';
import { ButtonWithAudio } from '@/components/common/button_with_audio';

import { QRCodeLogin } from './qrcode';
import { TokenLogin } from './token';

type LoginMethod = 'qrcode' | 'token';

interface LoginProps {
  /** 登录成功回调 */
  onLogin: (roles: GameRole[], loginMethod: LoginMethod, scanCode?: string) => void;
}

/**
 * 登录入口组件
 * 提供扫码和 Token 两种登录方式的切换
 */
export const Login = ({ onLogin }: LoginProps) => {
  const [method, setMethod] = useState<LoginMethod>('qrcode');
  const [loading, setLoading] = useState(false);

  const handleQRCodeLogin = (roles: GameRole[], scanCode: string) => {
    onLogin(roles, 'qrcode', scanCode);
  };

  const handleTokenLogin = (roles: GameRole[]) => {
    onLogin(roles, 'token');
  };

  return (
    <div className="flex flex-col min-h-75">
      {/* Tab 切换 */}
      <div className="flex border-b border-gray-200 shrink-0">
        <ButtonWithAudio
          onClick={() => setMethod('qrcode')}
          disabled={loading}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors border-b-2',
            method === 'qrcode'
              ? 'text-[#363636] border-[#FDFB73] bg-[#FDFB73]/10'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          )}
        >
          扫码登录
        </ButtonWithAudio>
        <ButtonWithAudio
          onClick={() => setMethod('token')}
          disabled={loading}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors border-b-2',
            method === 'token'
              ? 'text-[#363636] border-[#FDFB73] bg-[#FDFB73]/10'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          )}
        >
          Token 登录
        </ButtonWithAudio>
      </div>

      {/* 登录内容 */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {method === 'qrcode' ? (
            <motion.div key="qrcode">
              <QRCodeLogin onLogin={handleQRCodeLogin} onLoadingChange={setLoading} />
            </motion.div>
          ) : (
            <motion.div key="token">
              <TokenLogin onLogin={handleTokenLogin} onLoadingChange={setLoading} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export type { LoginMethod };
