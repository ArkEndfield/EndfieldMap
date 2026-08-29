import type {
  CustomPointPreset,
  ElectricPolePreset,
  PresetStoreDetailData,
  PresetType,
} from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import {
  Logo,
  LogoLoading,
  ScrollArea,
  useIsMobile,
  ZmdRoundButton,
  ZmdRoundIconButton,
} from '@endfieldmap/web-components';
import { ArrowLeftIcon, ImportIcon, UserIcon, ViewAltIcon } from '@endfieldmap/web-components';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { MapPreview } from '@/components/common/map-preview';
import { service } from '@/services';
import { catchErrorWithTip } from '@/utils/handler';

const TopDeco = ({ className }: { className?: string }) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <line x1="102.5" y1="0" x2="102.5" y2="105.464" stroke="currentColor" strokeWidth="35" />
    <line x1="12.374" y1="12.315" x2="107.416" y2="107.357" stroke="currentColor" strokeWidth="35" />
    <line x1="17.5" y1="83.941" x2="17.5" y2="120" stroke="currentColor" strokeWidth="35" />
  </svg>
);

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const isMobile = useIsMobile();

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
        await service.dataService.mapDataService.electricPoleDataService.importPreset(
          importData.name,
          importData.snapshot
        );
      } else {
        await service.dataService.mapDataService.customPointDataService.importPreset(
          importData.name,
          importData.snapshot
        );
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
      <div className="relative h-full flex items-center justify-center">
        <ZmdRoundIconButton onClick={onBack} className="absolute top-2 left-2 z-1">
          <ArrowLeftIcon />
        </ZmdRoundIconButton>
        <LogoLoading className="text-2xl" glowColor="#999999" />
      </div>
    );
  }

  // 加载失败
  if (error || !detail) {
    return (
      <div className="relative h-full flex flex-col items-center justify-center gap-3">
        <ZmdRoundIconButton onClick={onBack} className="absolute top-2 left-2 z-1">
          <ArrowLeftIcon />
        </ZmdRoundIconButton>
        <Logo className="text-4xl text-red-500" />
        <div className="text-red-500 text-sm">{error || t('common:load_error', { defaultValue: '加载失败' })}</div>
        <ZmdRoundButton type="default" onClick={onBack} showIcon={false}>
          {t('common:back', { defaultValue: '返回' })}
        </ZmdRoundButton>
      </div>
    );
  }

  const type = detail.preset_type;
  const subType = detail.sub_type;

  return (
    <div className="flex flex-col md:flex-row h-full relative">
      {/* Desktop: map preview (left side) */}
      {!isMobile && (
        <div className="relative flex-1 min-w-0 bg-[#e8e6e3]">
          <ZmdRoundIconButton onClick={onBack} className="absolute top-2 left-2 z-1">
            <ArrowLeftIcon />
          </ZmdRoundIconButton>
          {previewMapData && previewPreset ? (
            <MapPreview
              mapData={previewMapData}
              electricPolePreset={previewPreset.electricPolePreset}
              customPointPreset={previewPreset.customPointPreset}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-[#999]">
              {t('sidebar:preset_store.preview', { defaultValue: '预览' })}
            </div>
          )}
        </div>
      )}

      {/* Info panel — full on mobile, right sidebar on desktop */}
      <div className="flex-1 md:flex-none w-full md:w-72 flex flex-col bg-[#f0eeec] relative overflow-hidden">
        {/* Halftone dot overlay — top-right corner */}
        <div className="absolute -top-8 -right-8 w-72 h-72 pointer-events-none bg-[radial-gradient(circle,rgba(0,0,0,0.035)_0.75px,transparent_0.75px)] bg-[length:6px_6px] [mask-image:radial-gradient(circle_at_center,black,transparent_60%)]" />

        {/* TopDeco corner grid */}
        <div className="hidden md:grid absolute left-0 top-0 grid-cols-2 grid-rows-2 z-2 pointer-events-none">
          <div className="w-3 h-3 p-0.5 bg-[#313131] text-[#a6a5a5]">
            <TopDeco className="w-full h-full" />
          </div>
          <div className="w-3 h-3 bg-[#d1cece]" />
          <div className="w-3 h-3 bg-[repeating-linear-gradient(-45deg,#d6d4d4_0px,#d6d4d4_1px,#e2dfdf_1px,#e2dfdf_2px)]" />
        </div>

        {/* Corner marks */}
        <div className="absolute z-2 w-1 h-0.75 bg-[#a6a4a4] right-1 top-1 pointer-events-none" />
        <div className="absolute z-2 w-1 h-0.75 bg-[#888787] right-1 bottom-12 pointer-events-none" />
        <div className="absolute z-2 w-1 h-0.75 bg-[#888787] left-1 bottom-12 pointer-events-none" />

        {/* Bottom-right L-corner */}
        <div className="absolute bottom-12 right-0 w-5 h-5 border-b-2 border-r-2 border-[#313131]/15 pointer-events-none z-2" />

        <ScrollArea className="flex-1 min-h-0 relative z-1" scrollY scrollX={false} scrollbarY="auto">
          <div className="p-4 pt-3 md:pt-5 flex flex-col gap-3">
            {/* Decorative data code */}
            <span className="text-[10px] text-[#313131]/15 font-mono tracking-wider select-none">
              SYS://PRESET.0x{id.toString(16).toUpperCase().padStart(4, '0')}
            </span>

            {/* 标题 */}
            <h2 className="text-base font-bold text-[#363636] tracking-wide leading-snug">{detail.name}</h2>

            {/* 元信息 */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <UserIcon className="text-xs text-[#888] shrink-0" />
                <span className="text-[#555] truncate">{detail.user_id}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="text-xs text-[#888] shrink-0"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
                <span className="text-[#555]">{formatDate(detail.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ViewAltIcon className="text-xs text-[#888] shrink-0" />
                <span className="text-[#555]">{formatCount(detail.view_count)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ImportIcon className="text-xs text-[#888] shrink-0" />
                <span className="text-[#555]">{formatCount(detail.import_count)}</span>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="h-px bg-[#313131]/10" />

            {/* 类型标签 */}
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium text-[#363636] border-l-2 border-[#313131] pl-1.5">
                {t('sidebar:preset_store.type', { defaultValue: '类型' })}
              </h3>
              <div className="flex items-center gap-2 flex-wrap pl-3">
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 text-xs',
                    'bg-white/60 border',
                    type === 'electric_pole' ? 'text-[#E8C832] border-[#E8C832]/30' : 'text-blue-600 border-blue-300/40'
                  )}
                >
                  {type === 'electric_pole'
                    ? t('sidebar:preset_store.preset_type.electric_pole', { defaultValue: '电线杆' })
                    : t('sidebar:preset_store.preset_type.custom_point', { defaultValue: '自定义标点' })}
                </span>
                {subType && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs bg-white/60 text-[#666] border border-[#313131]/15">
                    {subType === 'pole'
                      ? t('sidebar:preset_store.sub_type.pole', { defaultValue: '电线杆' })
                      : t('sidebar:preset_store.sub_type.zipline', { defaultValue: '滑索' })}
                  </span>
                )}
              </div>
            </div>

            {/* 描述 */}
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium text-[#363636] border-l-2 border-[#313131] pl-1.5">
                {t('sidebar:preset_store.description', { defaultValue: '描述' })}
              </h3>
              <p className="text-xs text-[#666] leading-relaxed pl-3">{detail.description}</p>
            </div>
          </div>
        </ScrollArea>

        {/* 底部操作栏 */}
        <div className="relative flex items-center justify-between gap-2 px-4 py-2 bg-[#e6e3e1] shrink-0 z-1">
          <div className="absolute top-0 left-0 right-0 h-px bg-[#313131]/10" />
          <ZmdRoundButton type="default" onClick={onBack} showIcon={false}>
            {t('common:back', { defaultValue: '返回' })}
          </ZmdRoundButton>
          <div className="flex items-center gap-2">
            {isMobile && previewMapData && previewPreset && (
              <ZmdRoundButton type="default" icon={<ViewAltIcon />} onClick={() => setPreviewOpen(true)}>
                {t('sidebar:preset_store.preview', { defaultValue: '预览' })}
              </ZmdRoundButton>
            )}
            <ZmdRoundButton icon={<ImportIcon />} loading={importing} disabled={importing} onClick={handleImport}>
              {t('sidebar:preset_store.import', { defaultValue: '导入' })}
            </ZmdRoundButton>
          </div>
        </div>
      </div>

      {/* Mobile: fullscreen preview overlay */}
      <AnimatePresence>
        {isMobile && previewOpen && previewMapData && previewPreset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 1, 0.3, 1] }}
            className="absolute inset-0 z-10 bg-[#e8e6e3]"
          >
            <ZmdRoundIconButton onClick={() => setPreviewOpen(false)} className="absolute top-2 left-2 z-1">
              <ArrowLeftIcon />
            </ZmdRoundIconButton>
            <MapPreview
              mapData={previewMapData}
              electricPolePreset={previewPreset.electricPolePreset}
              customPointPreset={previewPreset.customPointPreset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
