import { cn } from '@endfieldmap/tools';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface PresetListItemProps {
  index: number;
  name: string;
  isActive: boolean;
  isSelected: boolean;
  onPress: () => void;
  onToggleSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
  onShare?: () => void;
  renameText: string;
  deleteText: string;
  shareText?: string;
}

export const PresetListItem: React.FC<PresetListItemProps> = ({
  index,
  name,
  isActive,
  isSelected,
  onPress,
  onToggleSelect,
  onRename,
  onDelete,
  onShare,
  renameText,
  deleteText,
  shareText,
}) => {
  return (
    <View
      className={cn(
        'flex-row items-center rounded-lg border px-3 py-3',
        isActive ? 'border-primary bg-primary/5' : 'border-border-light bg-bg-secondary',
      )}
    >
      {/* Selection checkbox */}
      <Pressable className="mr-2.5 p-0.5" onPress={onToggleSelect} hitSlop={8}>
        <View
          className={cn(
            'h-5 w-5 items-center justify-center rounded-full border-[1.5px]',
            isSelected ? 'border-primary bg-primary' : 'border-border-default bg-white',
          )}
        >
          {isSelected && <Text className="text-[11px] font-bold text-white">✓</Text>}
        </View>
      </Pressable>

      {/* Main area — tap to switch preset */}
      <Pressable className="flex-1 flex-row items-center" onPress={onPress}>
        <Text className="mr-2 w-5 text-center text-xs text-text-muted">{index}</Text>
        {isActive && <View className="mr-2 h-4 w-1 rounded-sm bg-primary" />}
        <Text className={cn('flex-1 text-sm', isActive ? 'font-semibold text-primary' : 'text-text-secondary')} numberOfLines={1}>
          {name}
        </Text>
      </Pressable>

      {/* Action buttons */}
      {onShare && (
        <Pressable className="rounded px-2 py-1" onPress={onShare} hitSlop={4}>
          {shareText ? (
            <Text className="text-xs text-primary">{shareText}</Text>
          ) : (
            <MaterialIcons name="share" size={16} color="#007AFF" />
          )}
        </Pressable>
      )}
      <Pressable className="rounded px-2 py-1" onPress={onRename} hitSlop={4}>
        <Text className="text-xs text-text-tertiary">{renameText}</Text>
      </Pressable>
      <Pressable className="ml-1 rounded px-2 py-1" onPress={onDelete} hitSlop={4}>
        <Text className="text-xs text-error">{deleteText}</Text>
      </Pressable>
    </View>
  );
};
