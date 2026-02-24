import type { MineTab, PresetType } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { PRESET_TYPE_OPTIONS, TAB_OPTIONS } from '@/const/preset-store';

interface MineFiltersProps {
  activeTab: MineTab;
  presetType: PresetType;
  isLoading?: boolean;
  onTabChange: (tab: MineTab) => void;
  onPresetTypeChange: (type: PresetType) => void;
  onRefresh?: () => void;
}

export const MineFilters = React.memo(function MineFilters({
  activeTab,
  presetType,
  isLoading = false,
  onTabChange,
  onPresetTypeChange,
  onRefresh,
}: MineFiltersProps) {
  const { t } = useTranslation(['sidebar']);

  return (
    <View>
      {/* Tab toggle: uploads / favorites */}
      <View className="flex-row justify-center px-3 pb-1 pt-3">
        <View className="flex-row overflow-hidden rounded-lg border border-border-default">
          {TAB_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              className={cn(
                'px-5 py-1.5',
                activeTab === opt.key ? 'bg-primary' : 'bg-bg-primary',
              )}
              onPress={() => onTabChange(opt.key)}
            >
              <Text
                className={cn(
                  'text-xs font-medium',
                  activeTab === opt.key ? 'text-white' : 'text-text-secondary',
                )}
              >
                {t(opt.labelKey, {
                  defaultValue: opt.key === 'uploads' ? '我的上传' : '我的收藏',
                })}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Preset type filter + refresh */}
      <View className="flex-row items-center justify-between px-3 py-2">
        <View className="flex-row overflow-hidden rounded-lg border border-border-default">
          {PRESET_TYPE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              className={cn(
                'px-4 py-1.5',
                presetType === opt.key ? 'bg-primary' : 'bg-bg-primary',
              )}
              onPress={() => onPresetTypeChange(opt.key)}
            >
              <Text
                className={cn(
                  'text-xs font-medium',
                  presetType === opt.key ? 'text-white' : 'text-text-secondary',
                )}
              >
                {t(opt.labelKey, {
                  defaultValue: opt.key === 'electric_pole' ? '电线杆' : '自定义标点',
                })}
              </Text>
            </Pressable>
          ))}
        </View>

        {onRefresh && (
          <Pressable
            className="items-center justify-center rounded-lg border border-border-default bg-bg-primary p-2"
            onPress={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size={16} color="#007AFF" />
            ) : (
              <MaterialIcons name="refresh" size={16} color="#666" />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
});
