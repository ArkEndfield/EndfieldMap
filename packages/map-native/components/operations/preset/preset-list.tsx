import React from 'react';
import { View } from 'react-native';

import { PresetListItem } from './preset-list-item';

interface PresetData {
  id: string;
  name: string;
}

interface PresetListProps {
  presets: PresetData[];
  currentPresetId: string;
  selectedIds: string[];
  onSwitchPreset: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  renameText: string;
  deleteText: string;
}

export const PresetList: React.FC<PresetListProps> = ({
  presets,
  currentPresetId,
  selectedIds,
  onSwitchPreset,
  onToggleSelect,
  onRename,
  onDelete,
  renameText,
  deleteText,
}) => {
  return (
    <View className="gap-2">
      {presets.map((preset, index) => (
        <PresetListItem
          key={preset.id}
          index={index + 1}
          name={preset.name}
          isActive={preset.id === currentPresetId}
          isSelected={selectedIds.includes(preset.id)}
          onPress={() => onSwitchPreset(preset.id)}
          onToggleSelect={() => onToggleSelect(preset.id)}
          onRename={() => onRename(preset.id)}
          onDelete={() => onDelete(preset.id)}
          renameText={renameText}
          deleteText={deleteText}
        />
      ))}
    </View>
  );
};
