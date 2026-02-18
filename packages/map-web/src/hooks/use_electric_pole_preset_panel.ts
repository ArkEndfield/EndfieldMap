import { logger } from '@endfieldmap/tools';
import { useLiveQuery } from '@tanstack/react-db';
import { useRef, useState } from 'react';
import { useTranslation } from '@endfieldmap/map-service';

import { alert } from '@/components/common/alert/alert_api';
import { EXPORT_TYPE_KEY } from '@/const/data';
import { useAdapter } from '@/hooks/use_adapter';
import { useMobxSource } from '@/hooks/use_mobx_source';
import { DataService } from '@/services/data';

export interface PresetItem {
  id: string;
  name: string;
}

export const useElectricPolePresetPanel = () => {
  const { t } = useTranslation(['common', 'sidebar']);
  const { mapDataService } = useAdapter();
  const service = mapDataService.electricPoleDataService;
  const currentPresetId = service.currentPresetId.value ?? '';

  const collections = useMobxSource(() => DataService.dbStorage.collections);

  const { data: presets } = useLiveQuery(
    (q) =>
      q.from({
        presets: collections.user.electricPolePreset.tanStackDbCollection,
      }),
    [collections]
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isSelectedAll = presets.length > 0 && selectedIds.length === presets.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < presets.length;

  const handleCreatePreset = async () => {
    const name = await alert.prompt({
      content: t('sidebar:operation.electric_pole.preset.create_tip'),
      defaultValue: t('sidebar:operation.electric_pole.preset.create_default_name'),
    });
    if (!name) return;
    await service.createPreset(name);
  };

  const handleSwitchPreset = async (id: string) => {
    if (!id) return;
    await service.switchPreset(id);
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

  const handleExportSelected = () => {
    if (!selectedIds.length) return;
    try {
      service.exportPresets(selectedIds);
    } catch (error) {
      logger.error('导出电线杆预设失败:', selectedIds, error);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    alert.confirm({
      content: t('sidebar:operation.electric_pole.preset.delete.confirm_batch', { count: selectedIds.length }),
      onConfirm: async () => {
        const tasks = selectedIds.map(
          (id): Promise<{ success: boolean; id: string }> =>
            new Promise((resolve) => {
              service
                .deletePreset(id)
                .then(() => resolve({ success: true, id }))
                .catch((error) => {
                  logger.error('批量删除电线杆预设失败:', id, error);
                  resolve({ success: false, id });
                });
            })
        );
        const result = await Promise.all(tasks);
        const fail = result.filter((item) => !item.success);
        const failCount = fail.length;
        const failIds = fail.map((item) => item.id);
        setSelectedIds(failIds);
        if (failCount > 0) {
          alert.info(
            t('sidebar:operation.electric_pole.preset.delete.batch_fail_tip', {
              count: failCount,
              ids: failIds.join(''),
            })
          );
        }
      },
    });
  };

  const handleDeletePreset = async (id: string) => {
    const preset = presets.find((p) => p.id === id);
    const name = preset?.name ?? '';
    alert.confirm({
      content: t('sidebar:operation.electric_pole.preset.delete.confirm', { name }),
      onConfirm: async () => {
        try {
          await service.deletePreset(id);
          setSelectedIds((prev) => prev.filter((x) => x !== id));
        } catch (error) {
          logger.error('电线杆删除失败', id, error);
          alert.info(t('sidebar:operation.electric_pole.preset.delete.fail_tip'));
        }
      },
    });
  };

  const handleRenamePreset = async (id: string) => {
    const preset = presets.find((p) => p.id === id);
    const currentName = preset?.name ?? '';
    const name = await alert.prompt({
      content: t('sidebar:operation.electric_pole.preset.create_tip'),
      defaultValue: currentName || t('sidebar:operation.electric_pole.preset.create_default_name'),
    });
    if (!name) return;
    await service.renamePreset(id, name);
  };

  const handleClickImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (parsed && parsed.type === EXPORT_TYPE_KEY.ELECTRIC_POLE_PRESET && Array.isArray(parsed.presets)) {
        await service.importPresetBundle(parsed);
        alert.info(t('sidebar:operation.electric_pole.preset.import.success'));
      } else {
        alert.info(
          t(
            'sidebar:operation.electric_pole.preset.import.failed',
            t('sidebar:operation.electric_pole.preset.import.format_error')
          )
        );
      }
    } catch (error) {
      logger.error('电线杆导入失败：', error);
      alert.info(
        t(
          'sidebar:operation.electric_pole.preset.import.failed',
          t('sidebar:operation.electric_pole.preset.import.error_tip')
        )
      );
    } finally {
      event.target.value = '';
    }
  };

  return {
    presets,
    currentPresetId,
    selectedIds,
    fileInputRef,
    isSelectedAll,
    isIndeterminate,
    handleCreatePreset,
    handleSwitchPreset,
    handleToggleSelect,
    handleToggleSelectAll,
    handleExportSelected,
    handleDeleteSelected,
    handleDeletePreset,
    handleRenamePreset,
    handleClickImport,
    handleImportFileChange,
  };
};
