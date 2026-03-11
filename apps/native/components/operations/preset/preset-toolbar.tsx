import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface PresetToolbarProps {
  selectedCount: number;
  onDeleteSelected: () => void;
  deleteSelectedText: string;
}

export const PresetToolbar: React.FC<PresetToolbarProps> = ({
  selectedCount,
  onDeleteSelected,
  deleteSelectedText,
}) => {
  if (selectedCount === 0) return null;

  return (
    <View className="flex-row items-center justify-end border-t border-t-border-light pt-3">
      <Pressable className="rounded-lg bg-error/10 px-4 py-2" onPress={onDeleteSelected}>
        <Text className="text-sm font-medium text-error">
          {deleteSelectedText} ({selectedCount})
        </Text>
      </Pressable>
    </View>
  );
};
