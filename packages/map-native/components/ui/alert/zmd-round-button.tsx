import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { cn } from '@/utils/style';

interface ZmdRoundButtonProps {
  type?: 'primary' | 'default';
  text?: string;
  showIcon?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

const TickIcon = ({ color }: { color: string }) => (
  <Svg viewBox="0 0 24 24" width={14} height={14} fill="none">
    <G>
      <Path
        d="M4.89163 13.2687L9.16582 17.5427L18.7085 8"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  </Svg>
);

const CloseIcon = ({ color }: { color: string }) => (
  <Svg viewBox="0 0 1024 1024" width={12} height={12}>
    <G>
      <Path
        fill={color}
        d="M195.2 195.2a64 64 0 0 1 90.496 0L512 421.504 738.304 195.2a64 64 0 0 1 90.496 90.496L602.496 512 828.8 738.304a64 64 0 0 1-90.496 90.496L512 602.496 285.696 828.8a64 64 0 0 1-90.496-90.496L421.504 512 195.2 285.696a64 64 0 0 1 0-90.496z"
      />
    </G>
  </Svg>
);

export function ZmdRoundButton({
  type = 'primary',
  text = '',
  showIcon = true,
  loading = false,
  disabled = false,
  onPress,
}: ZmdRoundButtonProps) {
  const isPrimary = type === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      className={cn(
        'min-w-[100px] flex-row items-center justify-center rounded-full border-[1.5px] px-2 py-1.5',
        isPrimary ? 'border-[#81807f] bg-[#2a2728]' : 'border-[#a0a2a3] bg-[#f2f1ef]',
        isDisabled && 'opacity-70',
      )}
    >
      <Text
        className={cn(
          'flex-1 text-center text-sm font-medium',
          isPrimary ? 'text-[#fefcfc]' : 'text-[#4d4d4d]',
        )}
      >
        {text}
      </Text>
      {showIcon && (
        <View
          className={cn(
            'ml-1 h-[22px] w-[22px] items-center justify-center rounded-full',
            isPrimary ? 'bg-[#fefcfc]' : 'bg-[#4d4d4d]',
          )}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffbb00" />
          ) : isPrimary ? (
            <TickIcon color="#2a2728" />
          ) : (
            <CloseIcon color="#f2f1ef" />
          )}
        </View>
      )}
    </Pressable>
  );
}
