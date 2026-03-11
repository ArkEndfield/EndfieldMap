import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Text, View } from 'react-native';

interface SubPopupTitleProps {
  children?: React.ReactNode;
}

export function SubPopupTitle({ children = 'Title' }: SubPopupTitleProps) {
  return (
    <View className="flex-row items-center gap-2 border-b border-border-light bg-bg-secondary px-4 py-2.5">
      <MaterialIcons name="change-history" size={14} color="#979796" />
      <Text className="text-sm font-bold text-text-muted" numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}
