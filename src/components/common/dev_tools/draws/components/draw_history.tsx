import { MapOL } from '@endfieldmap/map-core';
import { useCallback, useMemo, useRef, useState } from 'react';

import { DrawHistoryContext, type DrawHistoryContextValue } from '@/components/common/dev_tools/draws/context/draw_history';
import { getDevLayer } from '@/components/common/dev_tools/draws/utils';

export interface HistoryState {
  past: InstanceType<typeof MapOL.Feature>[][];
  present: InstanceType<typeof MapOL.Feature>[];
  future: InstanceType<typeof MapOL.Feature>[][];
}

const ZINDEX_KEY = 'devtools_zindex';

const cloneFeature = (feature: InstanceType<typeof MapOL.Feature>): InstanceType<typeof MapOL.Feature> => {
  const cloned = feature.clone();
  cloned.setStyle(feature.getStyle());
  cloned.set(ZINDEX_KEY, feature.get(ZINDEX_KEY));
  return cloned;
};

const cloneFeatures = (features: InstanceType<typeof MapOL.Feature>[]): InstanceType<typeof MapOL.Feature>[] => {
  return features.map(cloneFeature);
};

const applyZIndexToStyle = (feature: InstanceType<typeof MapOL.Feature>, zIndex: number) => {
  feature.set(ZINDEX_KEY, zIndex);
  const style = feature.getStyle();
  if (style && typeof style === 'object' && 'setZIndex' in style) {
    (style as InstanceType<typeof MapOL.style.Style>).setZIndex(zIndex);
  }
};

interface DrawHistoryProviderProps {
  map: InstanceType<typeof MapOL.Map> | null;
  children: React.ReactNode;
}

export const DrawHistoryProvider = ({ map, children }: DrawHistoryProviderProps) => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: [],
    future: [],
  });
  const zIndexCounter = useRef(0);

  const syncToMap = useCallback(
    (features: InstanceType<typeof MapOL.Feature>[]) => {
      if (!map) return;
      const layer = getDevLayer(map);
      const source = layer.getSource();
      if (!source) return;

      source.clear();
      features.forEach((f) => {
        const cloned = cloneFeature(f);
        const zIndex = f.get(ZINDEX_KEY);
        if (zIndex !== undefined) {
          applyZIndexToStyle(cloned, zIndex);
        }
        source.addFeature(cloned);
      });
    },
    [map]
  );

  const addFeature = useCallback(
    (feature: InstanceType<typeof MapOL.Feature>) => {
      if (!map) return;

      const currentZIndex = zIndexCounter.current++;
      applyZIndexToStyle(feature, currentZIndex);

      const layer = getDevLayer(map);
      layer.getSource()?.addFeature(feature);

      setHistory((prev) => ({
        past: [...prev.past, cloneFeatures(prev.present)],
        present: [...prev.present, cloneFeature(feature)],
        future: [],
      }));
    },
    [map]
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const previousState = newPast.pop()!;

      syncToMap(previousState);

      return {
        past: newPast,
        present: previousState,
        future: [cloneFeatures(prev.present), ...prev.future],
      };
    });
  }, [syncToMap]);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const nextState = newFuture.shift()!;

      syncToMap(nextState);

      return {
        past: [...prev.past, cloneFeatures(prev.present)],
        present: nextState,
        future: newFuture,
      };
    });
  }, [syncToMap]);

  const clear = useCallback(() => {
    if (!map) return;

    const layer = getDevLayer(map);
    layer.getSource()?.clear();

    setHistory((prev) => ({
      past: prev.present.length > 0 ? [...prev.past, cloneFeatures(prev.present)] : prev.past,
      present: [],
      future: [],
    }));
  }, [map]);

  const value = useMemo<DrawHistoryContextValue>(
    () => ({
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      featureCount: history.present.length,
      addFeature,
      undo,
      redo,
      clear,
    }),
    [history.past.length, history.future.length, history.present.length, addFeature, undo, redo, clear]
  );

  return <DrawHistoryContext.Provider value={value}>{children}</DrawHistoryContext.Provider>;
};