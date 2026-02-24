import React from 'react';
import { Image, Text, View } from 'react-native';

interface EntityFooterProps {
  name: string;
  pic: string;
  id: string | number;
  categoryName: string;
}

export function EntityFooter({ name, pic, id, categoryName }: EntityFooterProps) {
  return (
    <View className="overflow-hidden px-3 pb-2 pt-1">
      {pic ? (
        <Image
          source={{ uri: pic }}
          className="absolute -left-1 bottom-0 top-0 w-16 opacity-20"
          resizeMode="cover"
        />
      ) : null}
      <View className="flex-row items-end">
        <View className="flex-1 overflow-hidden">
          <Text className="text-xs text-text-muted" numberOfLines={1}>
            {categoryName}
          </Text>
          <Text className="text-lg font-bold text-text-primary" numberOfLines={1}>
            {name}
          </Text>
        </View>
        <Text className="ml-auto text-xs text-text-muted">ID {id}</Text>
      </View>
    </View>
  );
}
