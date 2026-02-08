import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { serverService } from '@/services/server';
import { cn } from '@/utils/style';

import type { BindType, GameRole } from '@/@types/game_role';
import { ButtonWithAudio } from '@/components/common/button_with_audio';

import { QRCodeLogin } from '@/components/features/user/info/bind_uid/login/qrcode';
import { TokenLogin } from '@/components/features/user/info/bind_uid/login/token';
import { SoundType } from '@/const/audio_config';
import { KeyIcon, ScanIcon } from '@/components/common/icons';
import { useTranslation } from 'react-i18next';

/**
 * 登录入口组件
 * 提供扫码和 Token 两种登录方式的切换
 */
export const Login = ({
  onLogin,
}: {
  /** 登录成功回调 */
  onLogin: (roles: GameRole[], loginMethod: BindType, scanCode?: string) => void;
}) => {
  const [method, setMethod] = useState<BindType>('scan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation('header');

  /**
   * 获取可绑定的游戏角色列表
   * @param form 登录方式：scan 或 token
   * @param credential 凭证：scan_code 或 hypergryph_token
   */
  const fetchBindableRoles = async (form: BindType, credential: string): Promise<GameRole[] | undefined> => {
    const params =
      form === 'scan' ? { form: 'scan', scan_code: credential } : { form: 'token', hypergryph_token: credential };
    const response = await serverService.apiPost<{ roles: GameRole[] }>('/user/game-roles/bindable', params);
    return response?.roles ?? [];
  };

  const handleLogin = async (form: BindType, credential: string) => {
    setError(null);
    setLoading(true);
    try {
      const roles = await fetchBindableRoles(form, credential);
      if (roles && roles.length >= 0) {
        onLogin(roles, form, credential);
      } else {
        setError(t('user.uid.no_roles_to_bind'));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t('user.uid.get_roles_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleQRCodeLogin = (scanCode: string) => handleLogin('scan', scanCode);

  const handleTokenLogin = (token: string) => handleLogin('token', token);

  useEffect(() => {
    return () => {
      setError(null);
    };
  }, [method]);

  return (
    <div className="flex flex-col min-h-75">
      {/* Tab 切换 */}
      <div className="flex border-b border-gray-200 shrink-0">
        <ButtonWithAudio
          onClick={() => setMethod('scan')}
          disabled={loading}
          soundType={SoundType.TICK}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-1',
            method === 'scan'
              ? 'text-[#363636] border-[#FDFB73] bg-[#FDFB73]/10'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          )}
        >
          <ScanIcon className="w-3.5 h-3.5 mr-1" />
          {t('user.uid.scan_login')}
        </ButtonWithAudio>
        <ButtonWithAudio
          onClick={() => setMethod('token')}
          disabled={loading}
          soundType={SoundType.TICK}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-1',
            method === 'token'
              ? 'text-[#363636] border-[#FDFB73] bg-[#FDFB73]/10'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          )}
        >
          <KeyIcon />
          {t('user.uid.token_login')}
        </ButtonWithAudio>
      </div>

      {/* 登录内容 */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {method === 'scan' ? (
            <motion.div key="scan">
              <QRCodeLogin onLogin={handleQRCodeLogin} onLoadingChange={setLoading} errorMessage={error} />
            </motion.div>
          ) : (
            <motion.div key="token">
              <TokenLogin onLogin={handleTokenLogin} errorMessage={error} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
