import type { EntityInfoDataJson, EntityJsonDataList, MapDataJson } from '@endfieldmap/map-core';
import type { CustomPointPreset, ElectricPolePreset } from '@endfieldmap/map-service';
import { useTranslation } from '@endfieldmap/map-service';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';

import { usePreviewAdapter } from '@/components/common/map-preview/use_preview_adapter';

export interface MapPreviewProps {
  /** 地图基础数据 (map_data.json) */
  mapData: MapDataJson;
  /** 实体数据 (level_entities_categorized.json 格式) 和实体信息 (entity_info.json 格式) */
  entity?: {
    jsonData: EntityJsonDataList;
    infoData: EntityInfoDataJson;
  };
  /** 自定义标点预设（单个） */
  customPointPreset?: CustomPointPreset;
  /** 电线杆预设（单个） */
  electricPolePreset?: ElectricPolePreset;
  /** 初始地图ID，默认使用 mapData 中第一个 */
  initialMapId?: string;
  /** 容器 className */
  className?: string;
}

/**
 * 地图预览组件
 * 仅支持渲染标点、移动视图、缩放和切换地图，不处理任何交互事件
 */
export const MapPreview: React.FC<MapPreviewProps> = observer(
  ({ mapData, entity, customPointPreset, electricPolePreset, initialMapId, className }) => {
    const { t } = useTranslation(['lang']);
    const containerRef = useRef<HTMLDivElement>(null);
    const { adapter } = usePreviewAdapter({
      containerRef,
      mapData,
      entity,
      customPointPreset,
      electricPolePreset,
      initialMapId,
    });

    const currentMapId = adapter?.mapController.dataManager.currentMapId;
    const currentMap = mapData.data.find((m) => m.id === currentMapId);

    const [showSwitcher, setShowSwitcher] = useState(false);

    const handleMapChange = useCallback(
      (mapId: string) => {
        if (adapter) {
          adapter.renderMap(mapId);
        }
        setShowSwitcher(false);
      },
      [adapter]
    );

    return (
      <div className={`relative overflow-hidden ${className ?? ''}`} style={{ width: '100%', height: '100%' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {adapter && mapData.data.length > 1 && (
          <div className="absolute top-2 right-2 z-10 flex flex-col items-end">
            <button
              className="rounded bg-[#303030e3] px-3 py-1.5 text-sm text-white hover:bg-[#444]"
              onClick={() => setShowSwitcher((v) => !v)}
            >
              {currentMap ? t(`lang:${currentMap.name}`, { defaultValue: currentMap.name }) : currentMapId}
            </button>
            <AnimatePresence>
              {showSwitcher && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="mt-1 flex flex-col gap-1 rounded bg-[#303030e3] p-1 overflow-hidden"
                >
                  {mapData.data.map((map) => (
                    <button
                      key={map.id}
                      className={`rounded px-3 py-1 text-sm whitespace-nowrap ${
                        map.id === currentMapId ? 'bg-[#fcfb58] text-[#444]' : 'text-white hover:bg-[#444]'
                      }`}
                      onClick={() => handleMapChange(map.id)}
                    >
                      {t(`lang:${map.name}`, { defaultValue: map.name })}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }
);
