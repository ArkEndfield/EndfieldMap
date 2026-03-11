import type { DataInstance } from '@endfieldmap/map-core';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, View } from 'react-native';

import { DeleteButton } from './delete-button';
import { MarkButton } from './mark-button';
import { RenameButton } from './rename-button';

interface EntityHeaderProps {
  entity: DataInstance;
  onClose: () => void;
}

export function EntityHeader({ entity, onClose }: EntityHeaderProps) {
  return (
    <View className="flex-row items-center justify-between border-b border-border-light px-2 py-1.5">
      <View className="flex-row items-center gap-0.5">
        <MarkButton entity={entity} />
        <RenameButton entity={entity} />
        <DeleteButton entity={entity} />
      </View>
      <Pressable className="items-center justify-center rounded-lg p-2" onPress={onClose}>
        <MaterialIcons name="close" size={22} color="#999" />
      </Pressable>
    </View>
  );
}
