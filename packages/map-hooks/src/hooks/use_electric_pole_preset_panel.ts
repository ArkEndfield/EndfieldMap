import { EXPORT_TYPE_KEY } from '@endfieldmap/map-service/const/data';
import { useMobxSource } from './use_mobx_source';
import type { MapService } from '@endfieldmap/map-service';
import { SERVICE_EVENT, serviceEmitter } from '@endfieldmap/map-service';
import { logger } from '@endfieldmap/tools';
import { useLiveQuery } from '@tanstack/react-db';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection } from './use_collection';

const promptAsync = (content: string, defaultValue?: string): Promise<string | null> => {
  return new Promise((resolve) => {
    serviceEmitter.fire(SERVICE_EVENT.ALERT_PROMPT, {
      content,
      defaultValue,
      onConfirm: (val) => {
        resolve(val);
      },
      onCancel: () => {
        resolve(null);
      },
    });
  });
};

export const useElectricPolePresetPanel = <T, R>(service: MapService<T, R>) => {
  const { t } = useTranslation(['common', 'sidebar']);
  const electricPoleDataService = service.dataService.mapDataService.electricPoleDataService;
  const currentPresetId = electricPoleDataService.currentPresetId.value ?? '';

  const collections = useMobxSource(() => service.databaseService.collections);
  const electricPoleDbCollection = useCollection(collections.user.electricPolePreset);

  const { data: presets } = useLiveQuery(
    (q) =>
      q.from({
        presets: electricPoleDbCollection,
      }),
    [electricPoleDbCollection]
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isSelectedAll = presets.length > 0 && selectedIds.length === presets.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < presets.length;

  const handleCreatePreset = async () => {
    const name = await promptAsync(
      t('sidebar:operation.electric_pole.preset.create_tip'),
      t('sidebar:operation.electric_pole.preset.create_default_name')
    );
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

  const handleExportSelected = () => {
    if (!selectedIds.length) return;
    try {
      electricPoleDataService.exportPresets(selectedIds);
    } catch (error) {
      logger.error('导出电线杆预设失败:', selectedIds, error);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    serviceEmitter.fire(SERVICE_EVENT.ALERT_CONFIRM, {
      content: t('sidebar:operation.electric_pole.preset.delete.confirm_batch', { count: selectedIds.length }),
      onConfirm: async () => {
        const tasks = selectedIds.map(
          (id): Promise<{ success: boolean; id: string }> =>
            new Promise((resolve) => {
              electricPoleDataService
                .deletePreset(id)
                .then(() => resolve({ success: true, id }))
                .catch((error: Error) => {
                  console.error('批量删除电线杆预设失败:', id, error);
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
          serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, {
            content: t('sidebar:operation.electric_pole.preset.delete.batch_fail_tip', {
              count: failCount,
              ids: failIds.join(''),
            }),
          });
        }
      },
    });
  };

  const handleDeletePreset = async (id: string) => {
    const preset = presets.find((p) => p.id === id);
    const name = preset?.name ?? '';
    serviceEmitter.fire(SERVICE_EVENT.ALERT_CONFIRM, {
      content: t('sidebar:operation.electric_pole.preset.delete.confirm', { name }),
      onConfirm: async () => {
        try {
          await electricPoleDataService.deletePreset(id);
          setSelectedIds((prev) => prev.filter((x) => x !== id));
        } catch (error) {
          logger.error('电线杆删除失败', id, error);
          serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, {
            content: t('sidebar:operation.electric_pole.preset.delete.fail_tip'),
          });
        }
      },
    });
  };

  const handleRenamePreset = async (id: string) => {
    const preset = presets.find((p) => p.id === id);
    const currentName = preset?.name ?? '';
    const name = await promptAsync(
      t('sidebar:operation.electric_pole.preset.create_tip'),
      currentName || t('sidebar:operation.electric_pole.preset.create_default_name')
    );
    if (!name) return;
    await electricPoleDataService.renamePreset(id, name);
  };

  const handleClickImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange = async (file?: File) => {
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (parsed && parsed.type === EXPORT_TYPE_KEY.ELECTRIC_POLE_PRESET && Array.isArray(parsed.presets)) {
        await electricPoleDataService.importPresetBundle(parsed);
        serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, {
          content: t('sidebar:operation.electric_pole.preset.import.success'),
        });
      } else {
        serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, {
          content: t(
            'sidebar:operation.electric_pole.preset.import.failed',
            t('sidebar:operation.electric_pole.preset.import.format_error')
          ),
        });
      }
    } catch (error) {
      logger.error('电线杆导入失败：', error);
      serviceEmitter.fire(SERVICE_EVENT.ALERT_INFO, {
        content: t(
          'sidebar:operation.electric_pole.preset.import.failed',
          t('sidebar:operation.electric_pole.preset.import.error_tip')
        ),
      });
    }
  };

  const canShare = () => {
    return electricPoleDataService.canShare;
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
    canShare,
  };
};
