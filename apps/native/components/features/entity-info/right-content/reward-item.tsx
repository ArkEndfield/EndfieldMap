import React from 'react';
import { Image, Text, View } from 'react-native';

interface RewardItemProps {
  name?: string;
  icon?: string;
  count?: number;
}

export function RewardItem({ icon, name = '', count }: RewardItemProps) {
  return (
    <View className="items-center">
      <View className="h-16 w-16 items-center justify-center rounded-md bg-bg-tertiary">
        {icon ? (
          <Image source={{ uri: icon }} className="h-12 w-12" resizeMode="contain" />
        ) : null}
        {count != null && count > 0 && (
          <View className="absolute bottom-0 left-0 right-0 items-center bg-black/20 py-0.5">
            <Text className="text-xs font-bold text-text-primary">{count}</Text>
          </View>
        )}
      </View>
      <Text className="mt-1 max-w-16 text-center text-xs text-text-secondary" numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}
