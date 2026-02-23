import { useTranslation } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio } from '@endfieldmap/web-components';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { ScanInfo, ScanStatusResponse } from '@/@types/game_role';
import { service } from '@/services';

/** 轮询间隔（毫秒） */
const POLL_INTERVAL = 2000;

interface QRCodeLoginProps {
  /** 扫码成功回调，返回 scan_code */
  onLogin: (scanCode: string) => void;
  /** 加载状态变化回调 */
  onLoadingChange?: (loading: boolean) => void;
  /** 错误信息，用于重置二维码状态 */
  errorMessage?: string | null;
}

/**
 * 扫码登录组件
 * 生成二维码，用户扫码后获取可绑定的游戏角色列表
 */
export const QRCodeLogin = ({ onLogin, onLoadingChange, errorMessage }: QRCodeLoginProps) => {
  const [scanInfo, setScanInfo] = useState<ScanInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'pending' | 'confirmed' | 'expired'>('loading');
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation(['header', 'error']);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentScanIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const checkStatusRef = useRef<(() => Promise<void>) | null>(null);

  // 清理轮询定时器
  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // 检查扫码状态
  const checkStatus = useCallback(async () => {
    if (!scanInfo || !isMountedRef.current) return;
    // 防止旧的轮询继续执行
    if (scanInfo.scan_id !== currentScanIdRef.current) return;

    let result: ScanStatusResponse | null = null;
    try {
      result = await service.serverService.apiGet<ScanStatusResponse>(
        `/user/game-roles/scan/status?scan_id=${encodeURIComponent(scanInfo.scan_id)}`
      );
    } catch (err) {
      if (!isMountedRef.current) return;
      if (scanInfo.scan_id !== currentScanIdRef.current) return;

      // 请求失败，显示错误信息并停止轮询
      setError(err instanceof Error ? err.message : t('error:qr_code.query_status'));
      setStatus('expired');
      return;
    }

    if (!isMountedRef.current) return;
    if (scanInfo.scan_id !== currentScanIdRef.current) return;

    if (!result) {
      // 请求失败，显示错误信息
      setError(t('error:qr_code.query_status'));
      setStatus('expired');
      return;
    }

    switch (result.status) {
      case 'pending':
        // status保持pending，触发下一次轮询
        pollTimerRef.current = setTimeout(() => checkStatusRef.current?.(), POLL_INTERVAL);
        break;

      case 'confirmed':
        // 扫码成功，回调 scan_code
        if (result.scan_code) {
          setStatus('confirmed');
          onLogin(result.scan_code);
        }
        break;

      case 'expired':
        // 二维码过期
        setStatus('expired');
        break;
    }
  }, [scanInfo, onLogin, t]);

  // 保持 checkStatusRef 始终指向最新的 checkStatus
  useEffect(() => {
    checkStatusRef.current = checkStatus;
  }, [checkStatus]);

  // 生成二维码
  const generateQRCode = useCallback(async () => {
    clearPollTimer();
    setStatus('loading');
    setError(null);
    onLoadingChange?.(true);

    try {
      const result = await service.serverService.apiPost<ScanInfo>('/user/game-roles/scan/generate');

      if (!isMountedRef.current) return;

      onLoadingChange?.(false);

      if (result) {
        setScanInfo(result);
        currentScanIdRef.current = result.scan_id;
        setStatus('pending');
      } else {
        setError(t('error:qr_code.generate'));
        setStatus('expired');
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      onLoadingChange?.(false);
      setError(err instanceof Error ? err.message : t('error:qr_code.generate'));
      setStatus('expired');
    }
  }, [clearPollTimer, onLoadingChange, t]);

  // 监听外部错误信息，用于重置二维码状态
  useEffect(() => {
    if (errorMessage) {
      setError(errorMessage);
      setStatus('expired');
    }
  }, [errorMessage]);

  // 轮询逻辑 - 启动首次轮询
  useEffect(() => {
    if (status === 'pending' && scanInfo) {
      // 清除之前的定时器（如果有）
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      // 启动轮询
      pollTimerRef.current = setTimeout(checkStatus, POLL_INTERVAL);
    }

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [status, scanInfo, checkStatus]);

  // 初始化生成二维码
  useEffect(() => {
    isMountedRef.current = true;
    generateQRCode();

    return () => {
      isMountedRef.current = false;
      clearPollTimer();
    };
  }, [generateQRCode, clearPollTimer]);

  return (
    <motion.div
      className="flex flex-col items-center gap-4 p-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* 说明文字 */}
      <div className="text-sm text-gray-600 text-center">{t('header:user.uid.qr_code.tip')}</div>

      {/* 二维码区域 */}
      <div className={cn('relative w-48 h-48 flex items-center justify-center', 'bg-white border-2 border-gray-200')}>
        {status === 'loading' && <div className="w-6 h-6 rounded-full border-t-2 border-gray-200 animate-spin" />}

        {status === 'pending' && scanInfo && (
          <QRCodeSVG value={scanInfo.scan_url} size={176} className="w-full" level="M" />
        )}

        {status === 'confirmed' && (
          <div className="text-green-500 text-sm font-medium">{t('header:user.uid.qr_code.success')}</div>
        )}

        {status === 'expired' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90">
            <div className="text-gray-500 text-sm mb-2">{error || t('error:qr_code.expired')}</div>
            <ButtonWithAudio
              onClick={generateQRCode}
              className="px-4 py-1.5 text-xs bg-[#363636] text-[#FDFB73] rounded hover:bg-[#484848]"
            >
              {t('header:user.uid.qr_code.refresh')}
            </ButtonWithAudio>
          </div>
        )}
      </div>
    </motion.div>
  );
};
