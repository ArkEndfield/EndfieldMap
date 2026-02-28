import type { CustomPointPreset, ElectricPolePreset,PresetStoreDetailData, PresetType } from '@endfieldmap/map-service';
import { useTranslation } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { ScrollArea,ZmdRoundButton, ZmdRoundIconButton } from '@endfieldmap/web-components';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { alert } from '@/components/common/alert/alert_api';
import { ArrowLeftIcon, ImportIcon, UserIcon, ViewAltIcon } from '@/components/common/icons';
import { MapPreview } from '@/components/common/map-preview';
import { service } from '@/services';
import { catchErrorWithTip } from '@/utils/handler';

interface PresetStoreDetailProps {
  id: number;
  onBack: () => void;
}

const formatCount = (count: number): string => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
};

const formatDate = (timestamp: number): string => {
  // 服务器返回秒级时间戳，需要转换为毫秒
  const date = new Date(timestamp * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const PresetStoreDetail = ({ id, onBack }: PresetStoreDetailProps) => {
  const { t } = useTranslation(['sidebar', 'common']);
  const [detail, setDetail] = useState<PresetStoreDetailData<PresetType> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await service.presetService.getPresetDetail(id);
        if (!cancelled) {
          setDetail(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // 构建预览用的预设数据
  const previewPreset = useMemo(() => {
    if (!detail) return null;

    const basePreset = {
      id: `preview-${detail.id}`,
      name: detail.name,
      createdAt: detail.created_at * 1000,
      updatedAt: detail.updated_at * 1000,
      data: detail.snapshot,
    };

    if (detail.preset_type === 'electric_pole') {
      return { electricPolePreset: basePreset as ElectricPolePreset };
    }
    return { customPointPreset: basePreset as CustomPointPreset };
  }, [detail]);

  // 构建预览用的地图数据
  const previewMapData = useMemo(() => {
    if (!service.dataService.mapDataService.mapData) return null;
    return {
      ...service.dataService.mapDataService.mapData,
      data: service.dataService.mapDataService.mapData.data.map((map) => ({
        ...map,
        zoom: {
          ...map.zoom,
          default: 1,
        },
      })),
    };
  }, []);

  // 导入预设
  const handleImport = useCallback(async () => {
    if (!detail || importing) return;

    setImporting(true);
    const result = await catchErrorWithTip(async () => {
      // 使用 getPresetImportData 获取数据（会增加导入计数）
      const importData = await service.presetService.getPresetImportData(id);

      if (detail.preset_type === 'electric_pole') {
        await service.dataService.mapDataService.electricPoleDataService.importPreset(importData.name, importData.snapshot);
      } else {
        await service.dataService.mapDataService.customPointDataService.importPreset(importData.name, importData.snapshot);
      }

      return true;
    });

    setImporting(false);

    if (result) {
      alert.info(t('sidebar:preset_store.import_success', { defaultValue: '导入成功' }));
    }
  }, [detail, importing, id, t]);

  // 加载中
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 border-b border-gray-200 bg-gray-50 shrink-0 h-10.25">
          <ZmdRoundIconButton onClick={onBack}>
            <ArrowLeftIcon />
          </ZmdRoundIconButton>
          <span className="text-sm font-medium text-[#363636]">
            {t('common:loading', { defaultValue: '加载中...' })}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{t('common:loading', { defaultValue: '加载中...' })}</span>
          </div>
        </div>
      </div>
    );
  }

  // 加载失败
  if (error || !detail) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 border-b border-gray-200 bg-gray-50 shrink-0 h-10.25">
          <ZmdRoundIconButton onClick={onBack}>
            <ArrowLeftIcon />
          </ZmdRoundIconButton>
          <span className="text-sm font-medium text-[#363636]">
            {t('common:load_error', { defaultValue: '加载失败' })}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="text-red-500 text-sm">{error || t('common:load_error', { defaultValue: '加载失败' })}</div>
          <ZmdRoundButton type="default" onClick={onBack} showIcon={false}>
            {t('common:back', { defaultValue: '返回' })}
          </ZmdRoundButton>
        </div>
      </div>
    );
  }

  const type = detail.preset_type;
  const subType = detail.sub_type;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 border-b border-gray-200 bg-gray-50 shrink-0 h-10.25">
        <ZmdRoundIconButton onClick={onBack}>
          <ArrowLeftIcon />
        </ZmdRoundIconButton>
        <span className="text-sm font-medium text-[#363636] truncate">{detail.name}</span>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1 min-h-0" scrollY scrollX={false} scrollbarY="auto">
        <div className="p-4 flex flex-col gap-4">
          {/* 基本信息 */}
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-[#363636]">{detail.name}</h2>
            <div className="flex items-center gap-3 text-xs text-[#999]">
              <span className="flex items-center gap-1">
                <UserIcon className="text-xs" />
                {detail.user_id}
              </span>
              <span>{formatDate(detail.created_at)}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#999]">
              <span className="flex items-center gap-1">
                <ViewAltIcon className="text-xs" />
                {formatCount(detail.view_count)}
              </span>
              <span className="flex items-center gap-1">
                <ImportIcon className="text-xs" />
                {formatCount(detail.import_count)}
              </span>
            </div>
          </div>

          {/* 描述 */}
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-[#363636]">
              {t('sidebar:preset_store.description', { defaultValue: '描述' })}
            </h3>
            <p className="text-xs text-[#666] leading-relaxed">{detail.description}</p>
          </div>

          {/* 预设类型标签 */}
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-[#363636]">
              {t('sidebar:preset_store.type', { defaultValue: '类型' })}
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 text-xs rounded-sm',
                  type === 'electric_pole'
                    ? 'bg-[#E8C832]/10 text-[#E8C832] border border-[#E8C832]/30'
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                )}
              >
                {type === 'electric_pole'
                  ? t('sidebar:preset_store.preset_type.electric_pole', { defaultValue: '电线杆' })
                  : t('sidebar:preset_store.preset_type.custom_point', { defaultValue: '自定义标点' })}
              </span>
              {/* 子类型标签 */}
              {subType && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-sm bg-gray-100 text-gray-600 border border-gray-200">
                  {subType === 'pole'
                    ? t('sidebar:preset_store.sub_type.pole', { defaultValue: '电线杆' })
                    : t('sidebar:preset_store.sub_type.zipline', { defaultValue: '滑索' })}
                </span>
              )}
            </div>
          </div>

          {/* 地图预览 */}
          {previewMapData && previewPreset && (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium text-[#363636]">
                {t('sidebar:preset_store.preview', { defaultValue: '预览' })}
              </h3>
              <div className="w-lg h-92 mx-auto max-w-full rounded-sm overflow-hidden border border-gray-200">
                <MapPreview
                  mapData={previewMapData}
                  electricPolePreset={previewPreset.electricPolePreset}
                  customPointPreset={previewPreset.customPointPreset}
                />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-gray-200 bg-gray-50 shrink-0">
        <ZmdRoundButton icon={<ImportIcon />} loading={importing} disabled={importing} onClick={handleImport}>
          {t('sidebar:preset_store.import', { defaultValue: '导入' })}
        </ZmdRoundButton>
      </div>
    </div>
  );
};
