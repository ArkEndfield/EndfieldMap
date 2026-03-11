import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';

import { cn } from '@endfieldmap/tools';

const CloseIcon = ({ color = '#fff' }: { color?: string }) => (
  <Svg viewBox="0 0 1024 1024" width={12} height={12}>
    <G>
      <Path
        fill={color}
        d="M195.2 195.2a64 64 0 0 1 90.496 0L512 421.504 738.304 195.2a64 64 0 0 1 90.496 90.496L602.496 512 828.8 738.304a64 64 0 0 1-90.496 90.496L512 602.496 285.696 828.8a64 64 0 0 1-90.496-90.496L421.504 512 195.2 285.696a64 64 0 0 1 0-90.496z"
      />
    </G>
  </Svg>
);

interface OperationTipProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const OperationTip: React.FC<OperationTipProps> = ({ open, onClose, children, className }) => {
  if (!open) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={LinearTransition.duration(200)}
      className={cn(
        'self-center flex-row items-center overflow-hidden rounded-full',
        'bg-black/60',
        className,
      )}
    >
      <View className="shrink flex-1 px-4 py-2">{children}</View>
      <Pressable
        onPress={onClose}
        className="mr-1.5 h-7 w-7 items-center justify-center rounded-full bg-white/15"
        hitSlop={8}
      >
        <CloseIcon />
      </Pressable>
    </Animated.View>
  );
};
