import type { MapData } from '@endfieldmap/map-core';
import { cn } from '@endfieldmap/tools';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAdapter } from '@/context/adapter-context';
import { service } from '@/services/map-service';

function translateMapName(
  map: MapData,
  t: (key: string, opts?: { defaultValue?: string }) => string
): string {
  return t(`lang:${map.name}`, { defaultValue: map.id });
}

export const MapSwitcher = observer(function MapSwitcher() {
  const { t } = useTranslation('lang');
  const adapter = useAdapter();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);

  const mapDataManager = adapter.mapController.dataManager;
  const currentMapId = mapDataManager.currentMapId;
  const mapList = mapDataManager.data;

  const currentMapName = useMemo(() => {
    const map = mapDataManager.currentMap;
    return map ? translateMapName(map, t) : currentMapId;
  }, [mapDataManager.currentMap, currentMapId, t]);

  const handleSwitch = useCallback(
    (mapId: string) => {
      if (mapId === currentMapId) {
        setExpanded(false);
        return;
      }
      service.dataService.mapDataService.mapStateDataService.setCurrentMap(mapId);
      setExpanded(false);
    },
    [currentMapId]
  );

  return (
    <View className="absolute right-4 z-10" style={{ top: insets.top + 56 }}>
      <Pressable
        className="flex-row items-center gap-1.5 rounded-[10px] bg-bg-glass px-3.5 py-2.5 shadow-md shadow-black/15 elevation-4"
        onPress={() => setExpanded(!expanded)}
      >
        <Text className="max-w-[120px] text-sm font-semibold text-text-secondary" numberOfLines={1}>
          {currentMapName}
        </Text>
        <Text className="text-[10px] text-text-tertiary">{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      {expanded && (
        <View className="mt-1.5 overflow-hidden rounded-[10px] bg-bg-glass shadow-md shadow-black/15 elevation-4">
          {mapList.map((map) => {
            const name = translateMapName(map, t);
            const isActive = map.id === currentMapId;
            return (
              <Pressable
                key={map.id}
                className={cn('border-b border-b-border-light px-3.5 py-3', isActive && 'bg-primary/6')}
                onPress={() => handleSwitch(map.id)}
              >
                <Text
                  className={cn('text-sm', isActive ? 'font-semibold text-primary' : 'text-text-secondary')}
                  numberOfLines={1}
                >
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
});
