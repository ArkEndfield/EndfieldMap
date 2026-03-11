import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCustomPointMode } from '@/hooks/use-custom-point-mode';
import { cn } from '@endfieldmap/tools';

interface ToolButtonConfig {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  active: boolean;
  onPress: () => void;
}

export const PointOperationButtons: React.FC = observer(() => {
  const { t } = useTranslation('sidebar');
  const { toggleMode, getCurrentMode } = useCustomPointMode();
  const currentMode = getCurrentMode();

  const tools: ToolButtonConfig[] = [
    {
      key: 'isCreating',
      label: t('operation.custom_point.create.start', { defaultValue: '创建' }),
      icon: 'add',
      active: currentMode === 'isCreating',
      onPress: () => toggleMode('isCreating'),
    },
    {
      key: 'isDeleting',
      label: t('operation.custom_point.delete.start', { defaultValue: '删除' }),
      icon: 'delete-outline',
      active: currentMode === 'isDeleting',
      onPress: () => toggleMode('isDeleting'),
    },
  ];

  return (
    <View className="mb-3 flex-row gap-2">
      {tools.map((tool) => (
        <Pressable
          key={tool.key}
          onPress={tool.onPress}
          className={cn(
            'flex-1 flex-row items-center justify-center gap-1.5 rounded-lg px-3 py-2.5',
            tool.active ? 'bg-primary' : 'bg-bg-tertiary',
          )}
        >
          <MaterialIcons name={tool.icon} size={18} color={tool.active ? '#fff' : '#666'} />
          <Text
            className={cn('text-sm font-medium', tool.active ? 'text-white' : 'text-text-tertiary')}
            numberOfLines={1}
          >
            {tool.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});
