import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@endfieldmap/tools';

interface PresetSelectBarProps {
  selectedCount: number;
  totalCount: number;
  isSelectedAll: boolean;
  isIndeterminate: boolean;
  onToggleSelectAll: () => void;
  selectAllText: string;
  selectedText: string;
}

export const PresetSelectBar: React.FC<PresetSelectBarProps> = ({
  selectedCount,
  totalCount,
  isSelectedAll,
  isIndeterminate,
  onToggleSelectAll,
  selectAllText,
  selectedText,
}) => {
  if (totalCount === 0) return null;

  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Pressable className="flex-row items-center gap-2" onPress={onToggleSelectAll} hitSlop={8}>
        <View
          className={cn(
            'h-5 w-5 items-center justify-center rounded-full border-[1.5px]',
            isSelectedAll || isIndeterminate ? 'border-primary bg-primary' : 'border-border-default bg-white',
          )}
        >
          {isSelectedAll && <Text className="text-[11px] font-bold text-white">✓</Text>}
          {isIndeterminate && !isSelectedAll && <Text className="text-[11px] font-bold text-white">−</Text>}
        </View>
        <Text className="text-sm text-text-secondary">{selectAllText}</Text>
      </Pressable>

      {selectedCount > 0 && (
        <Text className="text-xs text-text-muted">
          {selectedText}: {selectedCount}
        </Text>
      )}
    </View>
  );
};
