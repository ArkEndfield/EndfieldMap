import { useElectricPolePresetPanel } from '@endfieldmap/map-hooks';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { PoleOperationButtons } from '@/components/operations/electric-pole/pole-operation-buttons';
import { PresetList } from '@/components/operations/preset/preset-list';
import { PresetSelectBar } from '@/components/operations/preset/preset-select-bar';
import { PresetToolbar } from '@/components/operations/preset/preset-toolbar';
import { useAdapter } from '@/context/adapter-context';
import { service } from '@/services/map-service';

export interface ElectricPoleSheetRef {
  present: () => void;
  dismiss: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const ElectricPoleSheet = observer(
  forwardRef<ElectricPoleSheetRef>(function ElectricPoleSheet(_props, ref) {
    const { t } = useTranslation(['common', 'sidebar', 'header']);
    const sheetRef = useRef<TrueSheet>(null);
    const adapter = useAdapter();
    const isZoneVisible = adapter.electricPoleController.dataManager.zoneVisible;

    const router = useRouter();
    const {
      presets,
      currentPresetId,
      selectedIds,
      isSelectedAll,
      isIndeterminate,
      handleCreatePreset,
      handleSwitchPreset,
      handleToggleSelect,
      handleToggleSelectAll,
      handleDeleteSelected,
      handleDeletePreset,
      handleRenamePreset,
      canShare,
    } = useElectricPolePresetPanel(service);

    const handleSharePreset = useCallback(
      (id: string, name: string) => {
        if (!canShare()) return;
        sheetRef.current?.dismiss().catch(() => {});
        router.push({
          pathname: '/preset-share',
          params: { presetId: id, presetType: 'electric_pole', defaultName: name },
        });
      },
      [canShare, router]
    );

    useImperativeHandle(ref, () => ({
      present: () => {
        sheetRef.current?.present().catch(() => {});
      },
      dismiss: () => {
        sheetRef.current?.dismiss().catch(() => {});
      },
    }));

    return (
      <TrueSheet ref={sheetRef} cornerRadius={16} grabber>
        <View className="px-5 pt-5 pb-10" style={{ height: SCREEN_HEIGHT * 0.7 }}>
          {/* Header */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-text-primary">
              {t('header:head_menu.poles', { defaultValue: '电线杆管理' })}
            </Text>
            <Pressable className="rounded-lg bg-primary px-4 py-2" onPress={handleCreatePreset}>
              <Text className="text-sm font-medium text-white">{t('common:create', { defaultValue: '新建' })}</Text>
            </Pressable>
          </View>

          {/* Operation buttons */}
          <PoleOperationButtons />

          {/* Zone visibility toggle */}
          <View className="mb-3 flex-row items-center justify-between rounded-lg bg-bg-secondary px-3 py-2">
            <Text className="text-sm text-text-primary">
              {t('sidebar:operation.electric_pole.zone.display', { defaultValue: '显示范围' })}
            </Text>
            <Switch
              value={isZoneVisible}
              onValueChange={() => service.dataService.mapDataService.electricPoleDataService.toggleZoneVisibility()}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={isZoneVisible ? '#fff' : '#f4f3f4'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>

          {/* Select bar */}
          <PresetSelectBar
            selectedCount={selectedIds.length}
            totalCount={presets.length}
            isSelectedAll={isSelectedAll}
            isIndeterminate={isIndeterminate}
            onToggleSelectAll={handleToggleSelectAll}
            selectAllText={t('common:select_all', { defaultValue: '全选' })}
            selectedText={t('common:selected', { defaultValue: '已选' })}
          />

          {/* Preset list */}
          <ScrollView className="flex-1" contentContainerClassName="pb-5" showsVerticalScrollIndicator={false}>
            {presets.length > 0 ? (
              <PresetList
                presets={presets}
                currentPresetId={currentPresetId}
                selectedIds={selectedIds}
                onSwitchPreset={handleSwitchPreset}
                onToggleSelect={handleToggleSelect}
                onRename={handleRenamePreset}
                onDelete={handleDeletePreset}
                onShare={handleSharePreset}
                renameText={t('common:rename', { defaultValue: '重命名' })}
                deleteText={t('common:delete', { defaultValue: '删除' })}
              />
            ) : (
              <Text className="mt-10 text-center text-[15px] text-text-disabled">
                {t('sidebar:operation.electric_pole.preset.empty', { defaultValue: '暂无预设' })}
              </Text>
            )}
          </ScrollView>

          {/* Bottom toolbar */}
          <PresetToolbar
            selectedCount={selectedIds.length}
            onDeleteSelected={handleDeleteSelected}
            deleteSelectedText={t('common:batch_delete', { defaultValue: '批量删除' })}
          />
        </View>
      </TrueSheet>
    );
  })
);
