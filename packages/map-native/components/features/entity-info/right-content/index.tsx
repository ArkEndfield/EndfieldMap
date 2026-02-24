import React from 'react';
import { ScrollView, View } from 'react-native';

interface RightContentProps {
  items: React.ReactElement[];
}

export function RightContent({ items }: RightContentProps) {
  return (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {items}
      </ScrollView>
    </View>
  );
}
