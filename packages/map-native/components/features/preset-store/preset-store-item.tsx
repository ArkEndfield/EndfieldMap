import type { PresetStoreResponseItem } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export interface PresetStoreItemProps {
  item: PresetStoreResponseItem;
  onLike?: (id: number) => void;
  onOpen?: (id: number) => void;
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
}

const formatCount = (count: number): string => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const PresetStoreItem = React.memo(function PresetStoreItem({
  item,
  onLike,
  onOpen,
  onDelete,
  onEdit,
}: PresetStoreItemProps) {
  return (
    <Pressable
      className="max-w-[50%] flex-1 overflow-hidden rounded-xl bg-[#ece9e9]"
      onPress={() => onOpen?.(item.id)}
    >
      {/* Action buttons */}
      {(onDelete || onEdit) && (
        <View className="absolute right-1.5 top-1.5 z-10 flex-row gap-1">
          {onDelete && (
            <Pressable
              className="h-7 w-7 items-center justify-center rounded-full bg-white/80"
              onPress={() => onDelete(item.id)}
              hitSlop={4}
            >
              <MaterialIcons name="delete" size={14} color="#ff3d3d" />
            </Pressable>
          )}
          {onEdit && (
            <Pressable
              className="h-7 w-7 items-center justify-center rounded-full bg-white/80"
              onPress={() => onEdit(item.id)}
              hitSlop={4}
            >
              <MaterialIcons name="edit" size={14} color="#666" />
            </Pressable>
          )}
        </View>
      )}

      {/* Content */}
      <View className="p-3 pb-14">
        <Text className="text-sm font-bold text-text-primary" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="mt-1 text-xs text-text-muted" numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      {/* Bottom info */}
      <View className="absolute bottom-0 left-0 right-0 bg-black/5 px-2.5 pb-1.5 pt-1.5">
        {/* Author */}
        <View className="mb-1 flex-row items-center justify-end">
          <View className="flex-row items-center gap-1 rounded-full bg-[#313131] px-2 py-0.5">
            <MaterialIcons name="person" size={10} color="#F4F4F0" />
            <Text className="max-w-[64px] text-[10px] text-[#F4F4F0]" numberOfLines={1}>
              {item.user_nickname}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] text-[#999]">{formatDate(item.created_at)}</Text>
          <View className="flex-row items-center gap-2.5">
            <View className="flex-row items-center gap-0.5">
              <MaterialIcons name="visibility" size={10} color="#999" />
              <Text className="text-[10px] text-[#999]">{formatCount(item.view_count)}</Text>
            </View>
            <View className="flex-row items-center gap-0.5">
              <MaterialIcons name="file-download" size={10} color="#999" />
              <Text className="text-[10px] text-[#999]">{formatCount(item.import_count)}</Text>
            </View>

            {/* Like button */}
            <Pressable
              className="flex-row items-center gap-0.5"
              onPress={() => onLike?.(item.id)}
              hitSlop={6}
            >
              <MaterialIcons
                name={item.is_liked ? 'favorite' : 'favorite-border'}
                size={12}
                color={item.is_liked ? '#ff4757' : '#999'}
              />
              <Text
                className={cn('text-[10px]', item.is_liked ? 'text-[#ff4757]' : 'text-[#999]')}
              >
                {formatCount(item.like_count)}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
});
