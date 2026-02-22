import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Image, Modal, Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/style';

import type { AlertInstance } from './types';
import { alertStore } from './alert-store';
import { ZmdRoundButton } from './zmd-round-button';

const ALERT_BG = require('@/assets/images/alert/alert_bg.png') as number;
const ALERT_BANNER_LEFT = require('@/assets/images/alert/alert_banner_bg_left.png') as number;
const ALERT_BANNER_RIGHT = require('@/assets/images/alert/alert_banner_bg_right.png') as number;

const GLITCH_STEP_DURATION = 20;
const EXIT_ANIM_DURATION = 150;
const BANNER_HEIGHT = 48;
const RIGHT_BANNER_WIDTH = BANNER_HEIGHT * (353 / 228);
const LEFT_TILE_WIDTH = BANNER_HEIGHT * (73 / 228);

interface EndfieldAlertProps {
  instance: AlertInstance;
}

export const EndfieldAlert: React.FC<EndfieldAlertProps> = observer(({ instance }) => {
  const { config, visible, id, isPrompt, promptDefaultValue, promptPlaceholder } = instance;
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();

  // Prompt input value
  const [promptValue, setPromptValue] = useState(promptDefaultValue ?? '');

  const handlePromptChange = useCallback(
    (text: string) => {
      setPromptValue(text);
      alertStore.updatePromptValue(id, text);
    },
    [id],
  );

  // Initialize prompt value in store
  useEffect(() => {
    if (isPrompt && promptDefaultValue) {
      alertStore.updatePromptValue(id, promptDefaultValue);
    }
  }, [isPrompt, promptDefaultValue, id]);

  // Keep the RN Modal mounted while exit animation plays
  const [modalVisible, setModalVisible] = useState(true);
  const hasAnimatedIn = useRef(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmLoading, setConfirmLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const containerScaleY = useSharedValue(0);
  const containerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const animateIn = useCallback(() => {
    backdropOpacity.value = withTiming(1, { duration: 150 });
    containerScaleY.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    });
    containerOpacity.value = withTiming(1, { duration: 150 });

    // Glitch flicker effect for content — same keyframes as web
    const totalDuration = 205;
    const times = [0, 0.48, 0.82, 0.85, 0.87, 0.9, 0.92, 0.95, 0.97, 1];
    const values = [0, 1, 1, 0, 0, 1, 1, 0, 0, 1];

    const steps: ReturnType<typeof withTiming>[] = [];
    for (let i = 1; i < times.length; i++) {
      const segDuration = (times[i] - times[i - 1]) * totalDuration;
      steps.push(
        withTiming(values[i], {
          duration: Math.max(segDuration, GLITCH_STEP_DURATION),
          easing: Easing.steps(1, true),
        }),
      );
    }

    contentOpacity.value = withDelay(100, withSequence(...steps)) as number;
  }, [containerScaleY, containerOpacity, contentOpacity, backdropOpacity]);

  const animateOut = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: EXIT_ANIM_DURATION });
    containerScaleY.value = withTiming(0, {
      duration: EXIT_ANIM_DURATION,
      easing: Easing.in(Easing.ease),
    });
    containerOpacity.value = withTiming(0, { duration: 100 });
    contentOpacity.value = withTiming(0, { duration: EXIT_ANIM_DURATION });

    // Unmount Modal after exit animation finishes
    exitTimerRef.current = setTimeout(() => {
      setModalVisible(false);
    }, EXIT_ANIM_DURATION);
  }, [containerScaleY, containerOpacity, contentOpacity, backdropOpacity]);

  // Enter animation on mount
  useEffect(() => {
    if (!hasAnimatedIn.current) {
      hasAnimatedIn.current = true;
      animateIn();
    }
  }, [animateIn]);

  // Exit animation when visible changes to false
  useEffect(() => {
    if (!visible && hasAnimatedIn.current) {
      animateOut();
    }
  }, [visible, animateOut]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const handleDismiss = useCallback(async () => {
    if (config.dismissible === false) return;
    const result = await config.onDismiss?.();
    if (result !== false) {
      alertStore.remove(id);
    }
  }, [config, id]);

  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleDismiss();
      return true;
    });
    return () => subscription.remove();
  }, [visible, handleDismiss]);

  const handleCancel = useCallback(async () => {
    setCancelLoading(true);
    try {
      const result = await config.onCancel?.();
      if (result !== false) {
        alertStore.remove(id);
      }
    } finally {
      setCancelLoading(false);
    }
  }, [config, id]);

  const handleConfirm = useCallback(async () => {
    setConfirmLoading(true);
    try {
      const result = await config.onConfirm?.();
      if (result !== false) {
        alertStore.remove(id);
      }
    } finally {
      setConfirmLoading(false);
    }
  }, [config, id]);

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const containerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: containerScaleY.value }],
    opacity: containerOpacity.value,
  }));

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const loading = confirmLoading || cancelLoading;
  const alertWidth = Math.min(screenWidth * 0.85, 360);
  const leftTileCount = Math.ceil((alertWidth - RIGHT_BANNER_WIDTH) / LEFT_TILE_WIDTH) + 1;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View className="flex-1 items-center justify-center">
        {/* Backdrop */}
        <Animated.View
          className="absolute inset-0 bg-black/20"
          style={backdropAnimStyle}
        >
          <Pressable className="flex-1" onPress={handleDismiss} />
        </Animated.View>

        {/* Alert card */}
        <Animated.View
          className="rounded-[3px] bg-[#fefefe] shadow-lg"
          style={[containerAnimStyle, { width: alertWidth, overflow: 'hidden', paddingTop: 28, paddingBottom: 16 }]}
        >
          {/* Banner — left pattern tiles at correct scale, right image fixed */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: BANNER_HEIGHT,
              flexDirection: 'row',
              overflow: 'hidden',
            }}
          >
            <View style={{ flex: 1, overflow: 'hidden', flexDirection: 'row' }}>
              {Array.from({ length: leftTileCount }, (_, i) => (
                <Image
                  key={i}
                  source={ALERT_BANNER_LEFT}
                  style={{ width: LEFT_TILE_WIDTH, height: BANNER_HEIGHT }}
                  resizeMode="stretch"
                />
              ))}
            </View>
            <Image
              source={ALERT_BANNER_RIGHT}
              style={{ width: RIGHT_BANNER_WIDTH, height: BANNER_HEIGHT }}
              resizeMode="stretch"
            />
          </View>

          {/* Background decoration — bottom right, 90% width, max height capped */}
          <Image
            source={ALERT_BG}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '90%',
              aspectRatio: 663 / 239,
              maxHeight: 80,
            }}
            resizeMode="stretch"
          />

          {/* Content */}
          <Animated.View className="min-h-[60px] justify-center px-4 py-4" style={[contentAnimStyle, { zIndex: 1 }]}>
            <Text className="text-center text-[15px] leading-[22px] text-[#2a2728]">
              {config.content}
            </Text>
            {isPrompt && (
              <TextInput
                className="mt-3 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-[15px] text-[#2a2728]"
                value={promptValue}
                onChangeText={handlePromptChange}
                placeholder={promptPlaceholder}
                placeholderTextColor="#999"
                autoFocus
                selectTextOnFocus
              />
            )}
          </Animated.View>

          {/* Actions */}
          <Animated.View
            className={cn('flex-row gap-4 px-4 pt-4', config.hideCancel ? 'justify-center' : 'justify-between')}
            style={[contentAnimStyle, { zIndex: 1 }]}
          >
            {!config.hideCancel && (
              <View className="flex-1">
                <ZmdRoundButton
                  type="default"
                  text={config.cancelText ?? t('cancel')}
                  disabled={loading}
                  onPress={handleCancel}
                  loading={cancelLoading}
                />
              </View>
            )}
            <View className="flex-1">
              <ZmdRoundButton
                type="primary"
                text={config.confirmText ?? t('confirm')}
                disabled={loading}
                loading={confirmLoading}
                onPress={handleConfirm}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
});
