import type { BindType } from '@endfieldmap/map-service';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

import { alertApi } from '@/components/ui/alert';
import { service } from '@/services/map-service';
import { catchErrorWithTip } from '@/utils/error-handler';
import { cn } from '@/utils/style';

interface GameRole {
  uid: string;
  channel_name: string;
  server_id: string;
  server_name: string;
  role_id: string;
  nick_name: string;
  level: number;
}

const AUTO_RETURN_SECONDS = 5 * 60;

const CheckCircleIcon = () => (
  <Svg viewBox="0 0 24 24" width={12} height={12} fill="#E8C832">
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </Svg>
);

export default observer(function BindUidRolesScreen() {
  const { t } = useTranslation(['header', 'common']);
  const params = useLocalSearchParams<{ roles: string; method: string }>();
  const roles: GameRole[] = params.roles ? JSON.parse(params.roles) : [];
  const method = (params.method || 'scan') as BindType;

  const { uidList } = service.userService.auth;
  const boundUids = new Set(uidList.map((u) => u.uid));

  const [bindingId, setBindingId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(AUTO_RETURN_SECONDS);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  const handleBind = useCallback(
    async (roleId: string) => {
      setBindingId(roleId);
      const result = await catchErrorWithTip(() =>
        service.userService.bindUid(roleId, method)
      );
      setBindingId(null);
      if (result !== false) {
        alertApi.info({ content: t('header:user.uid.bind_success') });
      }
    },
    [method, t],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: t('header:user.uid.bind'),
          headerRight: () => (
            <Text className="text-xs text-text-muted">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </Text>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-bg-secondary" contentContainerClassName="px-4 pb-10 pt-4">
        {roles.length === 0 ? (
          <View className="items-center py-10">
            <Text className="text-sm text-text-muted">
              {t('header:user.uid.no_roles_to_bind')}
            </Text>
          </View>
        ) : (
          roles.map((role) => {
            const isBound = boundUids.has(role.role_id);

            return (
              <View
                key={role.role_id}
                className={cn(
                  'mb-2 rounded-xl border p-4',
                  isBound
                    ? 'border-[#E8C832]/30 bg-[#E8C832]/5'
                    : 'border-transparent bg-bg-primary',
                )}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[15px] font-semibold text-text-primary">
                        {role.nick_name}
                      </Text>
                      <View className="rounded-sm bg-[#2a2728] px-1.5 py-0.5">
                        <Text className="text-[10px] font-medium tracking-wider text-[#E8C832]">
                          LV.{role.level}
                        </Text>
                      </View>
                    </View>
                    <Text className="mt-1 text-xs text-text-muted">
                      UID {role.uid} · {role.server_name}
                    </Text>
                  </View>

                  {isBound ? (
                    <View className="flex-row items-center gap-1 rounded-sm border border-[#E8C832]/30 bg-[#E8C832]/10 px-2 py-1">
                      <CheckCircleIcon />
                      <Text className="text-xs font-medium text-[#E8C832]">
                        {t('header:user.binded')}
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      className={cn(
                        'rounded-md px-4 py-1.5',
                        bindingId !== null ? 'bg-black/10' : 'bg-[#E8C832]',
                      )}
                      onPress={() => handleBind(role.role_id)}
                      disabled={bindingId !== null}
                    >
                      {bindingId === role.role_id ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Text
                          className={cn(
                            'text-xs font-semibold',
                            bindingId !== null ? 'text-black/30' : 'text-black',
                          )}
                        >
                          {t('header:user.bind')}
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </>
  );
});
