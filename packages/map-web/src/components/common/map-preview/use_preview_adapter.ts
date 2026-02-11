import {
  EndfieldMapAdapter,
  type EntityInfoDataJson,
  type EntityJsonDataList,
  type MapDataJson,
} from '@endfieldmap/map-core';
import type { ElectricPoleDeviceKey } from '@endfieldmap/map-core/const/electric_pole';
import type { CustomPointNodeData, ElectricPoleNodeData } from '@endfieldmap/map-core/types';
import { useEffect, useRef, useState } from 'react';

import type { CustomPointPreset } from '@/@types/custom_point';
import type { ElectricPolePreset } from '@/@types/electric_pole';
import { getAssetUrls } from '@/utils/url';

export interface UsePreviewAdapterOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  mapData: MapDataJson;
  entity?: {
    jsonData: EntityJsonDataList;
    infoData: EntityInfoDataJson;
  };
  customPointPreset?: CustomPointPreset;
  electricPolePreset?: ElectricPolePreset;
  initialMapId?: string;
}

/**
 * 预览地图适配器 hook
 * 创建一个独立的 EndfieldMapAdapter 实例用于预览
 */
export function usePreviewAdapter(options: UsePreviewAdapterOptions) {
  const { containerRef, mapData, entity, customPointPreset, electricPolePreset, initialMapId } = options;
  const adapterRef = useRef<EndfieldMapAdapter | null>(null);
  const [adapter, setAdapter] = useState<EndfieldMapAdapter | null>(null);

  const initedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initedRef.current) return;
    initedRef.current = true;

    const container = containerRef.current;
    const assets = getAssetUrls();

    const efAdapter = new EndfieldMapAdapter({
      container,
      data: mapData,
      asset: {
        mapImage: assets.mapImage,
        entityImage: assets.entityImage,
      },
      map: {
        disableActiveFeature: true,
        disableHoverFeature: true,
      },
      popup: { enabled: false },
    });

    adapterRef.current = efAdapter;

    // 加载实体数据并设置全部可见
    if (entity) {
      efAdapter.entityController.loadData(entity.jsonData, entity.infoData);
      // 设置所有实体组可见
      for (const mapItem of entity.jsonData) {
        const groupManagers = efAdapter.entityController.dataManager.getMapGroupManagerList(mapItem.map_id);
        for (const manager of groupManagers) {
          manager.setGroupVisible(true);
        }
      }
    }

    // 加载电线杆预设数据
    if (electricPolePreset && electricPolePreset.data.length > 0) {
      const nodeData: ElectricPoleNodeData[] = electricPolePreset.data.map((item) => ({
        levelLogicId: item.levelLogicId,
        entityDataIdKey: item.entityDataIdKey,
        templateId: item.templateId,
        entityType: item.entityType,
        position: item.position,
        properties: item.properties as ElectricPoleNodeData['properties'],
        mapId: item.mapId,
      }));
      efAdapter.electricPoleController.loadElectricPoleData(nodeData);
      efAdapter.electricPoleController.setVisible(true);
      efAdapter.electricPoleController.setZoneVisible(true);
      // 设置每个地图的每种设备类型可见
      const deviceKeysByMap = new Map<string, Set<string>>();
      for (const item of nodeData) {
        const key = item.properties?.deviceKey;
        if (key) {
          if (!deviceKeysByMap.has(item.mapId)) deviceKeysByMap.set(item.mapId, new Set());
          deviceKeysByMap.get(item.mapId)!.add(key);
        }
      }
      for (const [mid, keys] of deviceKeysByMap) {
        for (const key of keys) {
          efAdapter.electricPoleController.setMapDeviceVisible(mid, key as ElectricPoleDeviceKey, true);
        }
      }
    }

    // 加载自定义标点预设数据
    if (customPointPreset && customPointPreset.data.length > 0) {
      const nodeData: CustomPointNodeData[] = customPointPreset.data.map((item) => ({
        levelLogicId: item.levelLogicId,
        entityDataIdKey: item.entityDataIdKey,
        templateId: item.templateId,
        entityType: item.entityType,
        position: item.position,
        properties: item.properties as CustomPointNodeData['properties'],
        mapId: item.mapId,
      }));
      efAdapter.customPointController.loadCustomPointData(nodeData);
      efAdapter.customPointController.setCustomPointVisible(true);
      // 设置每个地图的每种自定义标点类型可见
      const typeIdsByMap = new Map<string, Set<string>>();
      for (const item of nodeData) {
        if (!typeIdsByMap.has(item.mapId)) typeIdsByMap.set(item.mapId, new Set());
        typeIdsByMap.get(item.mapId)!.add(item.entityDataIdKey);
      }
      for (const [mid, typeIds] of typeIdsByMap) {
        for (const typeId of typeIds) {
          efAdapter.customPointController.setMapTypeVisible(mid, typeId, true);
        }
      }
    }

    // 数据加载完毕后渲染初始地图（必须在数据加载之后，否则标点不会渲染）
    const startMapId = initialMapId ?? mapData.data[0]?.id;
    if (startMapId && adapterRef.current) {
      adapterRef.current.renderMap(startMapId);
    }

    setAdapter(efAdapter);

    return () => {
      efAdapter.dispose();
      adapterRef.current = null;
      initedRef.current = false;
    };
  }, [containerRef, mapData, entity, customPointPreset, electricPolePreset, initialMapId]);

  return { adapter };
}
