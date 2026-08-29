import { cn } from '@endfieldmap/tools';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { alertApi } from '@/components/ui/alert';
import { StyledTextInput } from '@/components/ui/text-input';
import { service } from '@/services/map-service';
import { catchErrorWithTip } from '@/utils/error-handler';

interface GameRole {
  uid: string;
  channel_name: string;
  server_id: string;
  server_name: string;
  role_id: string;
  nick_name: string;
  level: number;
}

type LoginMethod = 'scan' | 'token';

export default function BindUidScreen() {
  const { t } = useTranslation('header');
  const router = useRouter();

  const handleRolesReady = useCallback((roles: GameRole[], method: LoginMethod) => {
    router.replace({
      pathname: '/bind-uid-roles',
      params: { roles: JSON.stringify(roles), method },
    });
  }, [router]);

  return (
    <>
      <Stack.Screen options={{ title: t('user.uid.bind') }} />
      <View className="flex-1 bg-bg-secondary">
        <LoginStep onRolesReady={handleRolesReady} />
      </View>
    </>
  );
}

function LoginStep({
  onRolesReady,
}: {
  onRolesReady: (roles: GameRole[], method: LoginMethod) => void;
}) {
  const { t } = useTranslation('header');
  const [tab, setTab] = useState<LoginMethod>('scan');

  return (
    <View className="flex-1 px-4 pt-4">
      <View className="mb-4 flex-row rounded-xl bg-bg-primary p-1">
        <Pressable
          className={cn('flex-1 items-center rounded-lg py-2.5', tab === 'scan' && 'bg-primary')}
          onPress={() => setTab('scan')}
        >
          <Text className={cn('text-sm font-semibold', tab === 'scan' ? 'text-white' : 'text-text-muted')}>
            {t('user.uid.scan_login')}
          </Text>
        </Pressable>
        <Pressable
          className={cn('flex-1 items-center rounded-lg py-2.5', tab === 'token' && 'bg-primary')}
          onPress={() => setTab('token')}
        >
          <Text className={cn('text-sm font-semibold', tab === 'token' ? 'text-white' : 'text-text-muted')}>
            {t('user.uid.token_login')}
          </Text>
        </Pressable>
      </View>

      {tab === 'scan' ? (
        <QRCodeLogin onRolesReady={(roles) => onRolesReady(roles, 'scan')} />
      ) : (
        <TokenLogin onRolesReady={(roles) => onRolesReady(roles, 'token')} />
      )}
    </View>
  );
}

function QRCodeLogin({ onRolesReady }: { onRolesReady: (roles: GameRole[]) => void }) {
  const { t } = useTranslation(['header', 'error']);
  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'pending' | 'confirmed' | 'expired'>('loading');
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const generateQR = useCallback(async () => {
    setStatus('loading');
    setError(null);
    const result = await catchErrorWithTip(async () => {
      const res = await service.serverService.apiPost<{ scan_id: string; scan_url: string }>(
        '/user/game-roles/scan/generate'
      );
      return res;
    });
    if (!mountedRef.current) return;
    if (result === false) {
      setError(t('error:qr_code.generate'));
      setStatus('expired');
      return;
    }
    setScanUrl(result.scan_url);
    setScanId(result.scan_id);
    setStatus('pending');
  }, [t]);

  useEffect(() => {
    mountedRef.current = true;
    queueMicrotask(() => {
      if (!mountedRef.current) return;
      void generateQR();
    });
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [generateQR, stopPolling]);

  useEffect(() => {
    if (status !== 'pending' || !scanId) return;
    stopPolling();

    pollingRef.current = setInterval(async () => {
      const result = await catchErrorWithTip(async () => {
        const res = await service.serverService.apiGet<{ status: string; scan_code: string | null }>(
          `/user/game-roles/scan/status?scan_id=${scanId}`
        );
        return res;
      });
      if (!mountedRef.current) return;
      if (result === false) {
        stopPolling();
        setError(t('error:qr_code.query_status'));
        setStatus('expired');
        return;
      }

      if (result.status === 'confirmed' && result.scan_code) {
        stopPolling();
        setStatus('confirmed');
        const rolesResult = await catchErrorWithTip(async () => {
          const res = await service.serverService.apiPost<{ roles: GameRole[] }>(
            '/user/game-roles/bindable',
            { form: 'scan', scan_code: result.scan_code }
          );
          return res;
        });
        if (!mountedRef.current) return;
        if (rolesResult === false) {
          setError(t('header:user.uid.get_roles_failed'));
          setStatus('expired');
          return;
        }
        onRolesReady(rolesResult.roles);
      } else if (result.status === 'expired') {
        stopPolling();
        setStatus('expired');
      }
    }, 2000);

    return stopPolling;
  }, [status, scanId, stopPolling, onRolesReady, t]);

  return (
    <View className="items-center py-6">
      {status === 'loading' ? (
        <View className="h-52 w-52 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : status === 'expired' ? (
        <View className="items-center">
          <View className="mb-4 h-52 w-52 items-center justify-center rounded-2xl bg-bg-primary">
            <Text className="px-4 text-center text-base text-text-muted">
              {error || t('error:qr_code.expired')}
            </Text>
          </View>
          <Pressable className="rounded-lg bg-primary px-6 py-2.5" onPress={generateQR}>
            <Text className="text-sm font-semibold text-white">
              {t('header:user.uid.qr_code.refresh')}
            </Text>
          </Pressable>
        </View>
      ) : status === 'confirmed' ? (
        <View className="h-52 w-52 items-center justify-center">
          <ActivityIndicator size="large" color="#22c55e" />
          <Text className="mt-3 text-sm text-text-muted">
            {t('user.uid.qr_code.success')}
          </Text>
        </View>
      ) : scanUrl ? (
        <View className="items-center">
          <View className="rounded-2xl bg-white p-4">
            <QRCode value={scanUrl} size={180} />
          </View>
          <Text className="mt-4 text-center text-sm text-text-muted">
            {t('user.uid.qr_code.tip')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function TokenLogin({ onRolesReady }: { onRolesReady: (roles: GameRole[]) => void }) {
  const { t } = useTranslation('header');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!token.trim()) {
      alertApi.info({
        content: t('user.uid.token.tip'),
      });
      return;
    }
    setLoading(true);
    const result = await catchErrorWithTip(async () => {
      const res = await service.serverService.apiPost<{ roles: GameRole[] }>(
        '/user/game-roles/bindable',
        { form: 'token', hypergryph_token: token.trim() }
      );
      return res;
    });
    setLoading(false);
    if (result !== false) {
      onRolesReady(result.roles);
    }
  }, [token, onRolesReady, t]);

  return (
    <View className="py-4">
      <Text className="mb-2 text-sm text-text-muted">
        {t('user.uid.token.tip')}
      </Text>
      <StyledTextInput
        placeholder={t('user.uid.token.placeholder')}
        value={token}
        onChangeText={setToken}
        multiline
        numberOfLines={4}
        style={{ height: 120, textAlignVertical: 'top' }}
      />
      <Pressable
        className={cn('mt-2 items-center rounded-xl py-3.5', token.trim() ? 'bg-primary' : 'bg-primary/40')}
        onPress={handleSubmit}
        disabled={loading || !token.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">
            {t('user.uid.token.submit')}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
