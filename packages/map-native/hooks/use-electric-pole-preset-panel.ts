import { logger } from '@endfieldmap/tools';
import { useLiveQuery } from '@tanstack/react-db';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { alertApi } from '@/components/ui/alert/alert-api';
import { useMobxSource } from '@/hooks/use-mobx-source';
import { service } from '@/services/map-service';

export interface PresetItem {
  id: string;
  name: string;
}

export const useElectricPolePresetPanel = () => {
  const { t } = useTranslation(['common', 'sidebar']);

  const electricPoleDataService = service.dataService.mapDataService.electricPoleDataService;
  const currentPresetId = electricPoleDataService.currentPresetId.value ?? '';

  const collections = useMobxSource(() => service.databaseService.collections);

  const { data: presets } = useLiveQuery(
    (q) =>
      q.from({
        presets: collections.user.electricPolePreset.tanStackDbCollection,
      }),
    [collections],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isSelectedAll = presets.length > 0 && selectedIds.length === presets.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < presets.length;

  const handleCreatePreset = async () => {
    const name = await alertApi.prompt({
      content: t('sidebar:operation.electric_pole.preset.create_tip'),
      defaultValue: t('sidebar:operation.electric_pole.preset.create_default_name'),
    });
    if (!name) return;
    await electricPoleDataService.createPreset(name);
  };

  const handleSwitchPreset = async (id: string) => {
    if (!id) return;
    await electricPoleDataService.switchPreset(id);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const checked = prev.includes(id);
      if (checked) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const handleToggleSelectAll = () => {
    if (isSelectedAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(presets.map((p) => p.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    alertApi.confirm({
      content: t('sidebar:operation.electric_pole.preset.delete.confirm_batch', { count: selectedIds.length }),
      onConfirm: async () => {
        const tasks = selectedIds.map(
          (id): Promise<{ success: boolean; id: string }> =>
            new Promise((resolve) => {
              electricPoleDataService
                .deletePreset(id)
                .then(() => resolve({ success: true, id }))
                .catch((error) => {
                  logger.error('批量删除电线杆预设失败:', id, error);
                  resolve({ success: false, id });
                });
            }),
        );
        const result = await Promise.all(tasks);
        const fail = result.filter((item) => !item.success);
        const failCount = fail.length;
        const failIds = fail.map((item) => item.id);
        setSelectedIds(failIds);
        if (failCount > 0) {
          alertApi.info(
            t('sidebar:operation.electric_pole.preset.delete.batch_fail_tip', {
              count: failCount,
              ids: failIds.join(''),
            }),
          );
        }
      },
    });
  };

  const handleDeletePreset = async (id: string) => {
    const preset = presets.find((p) => p.id === id);
    const name = preset?.name ?? '';
    alertApi.confirm({
      content: t('sidebar:operation.electric_pole.preset.delete.confirm', { name }),
      onConfirm: async () => {
        try {
          await electricPoleDataService.deletePreset(id);
          setSelectedIds((prev) => prev.filter((x) => x !== id));
        } catch (error) {
          logger.error('电线杆删除失败', id, error);
          alertApi.info(t('sidebar:operation.electric_pole.preset.delete.fail_tip'));
        }
      },
    });
  };

  const handleRenamePreset = async (id: string) => {
    const preset = presets.find((p) => p.id === id);
    const currentName = preset?.name ?? '';
    const name = await alertApi.prompt({
      content: t('sidebar:operation.electric_pole.preset.create_tip'),
      defaultValue: currentName || t('sidebar:operation.electric_pole.preset.create_default_name'),
    });
    if (!name) return;
    await electricPoleDataService.renamePreset(id, name);
  };

  return {
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
  };
};
