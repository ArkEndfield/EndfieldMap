import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

import { serverService } from '@/services/server';
import { cn } from '@/utils/style';

import type { GameRole, ScanInfo, ScanStatusResponse } from '@/@types/game_role';
import { ButtonWithAudio } from '@/components/common/button_with_audio';

/** 轮询间隔（毫秒） */
const POLL_INTERVAL = 2000;

interface QRCodeLoginProps {
  /** 登录成功回调，返回可绑定的角色列表和 scan_code */
  onLogin: (roles: GameRole[], scanCode: string) => void;
  /** 加载状态变化回调 */
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * 扫码登录组件
 * 生成二维码，用户扫码后获取可绑定的游戏角色列表
 */
export const QRCodeLogin = ({ onLogin, onLoadingChange }: QRCodeLoginProps) => {
  const [scanInfo, setScanInfo] = useState<ScanInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'pending' | 'confirmed' | 'expired'>('loading');
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // 清理轮询定时器
  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // 生成二维码
  const generateQRCode = useCallback(async () => {
    clearPollTimer();
    setStatus('loading');
    setError(null);
    onLoadingChange?.(true);

    try {
      const result = await serverService.apiPost<ScanInfo>('/user/game-roles/scan/generate');

      if (!isMountedRef.current) return;

      onLoadingChange?.(false);

      if (result) {
        setScanInfo(result);
        setStatus('pending');
      } else {
        setError('生成二维码失败');
        setStatus('expired');
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      onLoadingChange?.(false);
      setError(err instanceof Error ? err.message : '生成二维码失败');
      setStatus('expired');
    }
  }, [clearPollTimer, onLoadingChange]);

  // 检查扫码状态
  const checkStatus = useCallback(async () => {
    if (!scanInfo || !isMountedRef.current) return;

    let result: ScanStatusResponse | null = null;
    try {
      result = await serverService.apiGet<ScanStatusResponse>(
        `/user/game-roles/scan/status?scan_id=${encodeURIComponent(scanInfo.scan_id)}`
      );
    } catch (err) {
      if (!isMountedRef.current) return;

      // 请求失败，显示错误信息并停止轮询
      setError(err instanceof Error ? err.message : '查询状态失败');
      setStatus('expired');
      return;
    }

    if (!isMountedRef.current) return;

    if (!result) {
      // 请求失败，显示错误信息
      setError('查询状态失败');
      setStatus('expired');
      return;
    }

    switch (result.status) {
      case 'pending':
        // 继续轮询
        pollTimerRef.current = setTimeout(checkStatus, POLL_INTERVAL);
        break;

      case 'confirmed':
        // 扫码成功，获取角色列表
        if (result.scan_code) {
          setStatus('confirmed');
          onLoadingChange?.(true);

          try {
            const rolesResult = await serverService.apiPost<{ roles: GameRole[] }>('/user/game-roles/scan/roles', {
              scan_code: result.scan_code,
            });

            onLoadingChange?.(false);

            if (!isMountedRef.current) return;

            if (rolesResult?.roles) {
              onLogin(rolesResult.roles, result.scan_code);
            } else {
              // 获取角色列表失败，重置二维码状态
              setError('获取角色列表失败，请重试');
              setStatus('expired');
            }
          } catch (err) {
            onLoadingChange?.(false);

            if (!isMountedRef.current) return;

            setError(err instanceof Error ? err.message : '获取角色列表失败，请重试');
            setStatus('expired');
          }
        }
        break;

      case 'expired':
        // 二维码过期
        setStatus('expired');
        break;
    }
  }, [scanInfo, onLogin, onLoadingChange]);

  // 开始轮询
  useEffect(() => {
    if (status === 'pending' && scanInfo) {
      pollTimerRef.current = setTimeout(checkStatus, POLL_INTERVAL);
    }
    return clearPollTimer;
  }, [status, scanInfo, checkStatus, clearPollTimer]);

  // 初始化生成二维码
  useEffect(() => {
    isMountedRef.current = true;
    generateQRCode();

    return () => {
      isMountedRef.current = false;
      clearPollTimer();
    };
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center gap-4 p-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* 说明文字 */}
      <div className="text-sm text-gray-600 text-center">
        <p>请使用森空岛 APP 扫描二维码</p>
      </div>

      {/* 二维码区域 */}
      <div className={cn('relative w-48 h-48 flex items-center justify-center', 'bg-white border-2 border-gray-200')}>
        {status === 'loading' && <div className="w-6 h-6 rounded-full border-t-2 border-gray-200 animate-spin" />}

        {status === 'pending' && scanInfo && <QRCodeSVG value={scanInfo.scan_url} size={176} level="M" />}

        {status === 'confirmed' && <div className="text-green-500 text-sm font-medium">扫码成功</div>}

        {status === 'expired' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90">
            <div className="text-gray-500 text-sm mb-2">{error || '二维码已过期'}</div>
            <ButtonWithAudio
              onClick={generateQRCode}
              className="px-4 py-1.5 text-xs bg-[#363636] text-[#FDFB73] rounded hover:bg-[#484848]"
            >
              刷新二维码
            </ButtonWithAudio>
          </div>
        )}
      </div>
    </motion.div>
  );
};
