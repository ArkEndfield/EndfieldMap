import { observer } from 'mobx-react-lite';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAdapter } from '@/context/adapter';

/**
 * 地图切换器
 * 悬浮在地图上方，点击展开地图列表
 */
export const MapSwitcher = observer(function MapSwitcher() {
  const adapter = useAdapter();
  const [expanded, setExpanded] = useState(false);

  const mapDataManager = adapter.mapController.dataManager;
  const currentMapId = mapDataManager.currentMapId;
  const mapList = mapDataManager.data;

  const handleSwitch = useCallback(
    (mapId: string) => {
      if (mapId === currentMapId) {
        setExpanded(false);
        return;
      }
      adapter.renderMap(mapId);
      setExpanded(false);
    },
    [adapter, currentMapId]
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.currentButton} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.currentText} numberOfLines={1}>
          {currentMapId}
        </Text>
        <Text style={styles.arrow}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.dropdown}>
          {mapList.map((map) => (
            <Pressable
              key={map.id}
              style={[styles.mapItem, map.id === currentMapId && styles.mapItemActive]}
              onPress={() => handleSwitch(map.id)}
            >
              <Text
                style={[styles.mapItemText, map.id === currentMapId && styles.mapItemTextActive]}
                numberOfLines={1}
              >
                {map.id}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 10,
  },
  currentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  currentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    maxWidth: 100,
  },
  arrow: {
    fontSize: 10,
    color: '#666',
  },
  dropdown: {
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  mapItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  mapItemActive: {
    backgroundColor: '#007AFF10',
  },
  mapItemText: {
    fontSize: 14,
    color: '#333',
  },
  mapItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
