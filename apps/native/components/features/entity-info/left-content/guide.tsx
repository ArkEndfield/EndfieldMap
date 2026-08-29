import type { CustomPointData, ElectricPoleData, EntityData } from '@endfieldmap/map-core';
import type { GuideInfoDetail, GuideNodeType } from '@endfieldmap/map-service';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';

import { service } from '@/services/map-service';

import { GuideNode } from './guide-node';

function collectImages(nodes: GuideNodeType[]) {
  const sources: string[] = [];
  const imageIndexMap = new Map<GuideNodeType, number>();

  const processNodes = (nodeList: GuideNodeType[]) => {
    for (const node of nodeList) {
      if (node.type === 'image') {
        const isBase64 = node.src.startsWith('data:image');
        imageIndexMap.set(node, sources.length);
        sources.push(isBase64 ? node.src : `/images/guides/e0m2_3_flashback_008.png`);
      } else if (node.type === 'node') {
        processNodes(node.nodes);
      }
    }
  };

  processNodes(nodes);
  return { sources, imageIndexMap };
}

interface GuideProps {
  entity: EntityData | CustomPointData | ElectricPoleData;
}

export function Guide({ entity }: GuideProps) {
  const [guide, setGuide] = useState<GuideInfoDetail | null>(null);
  const [previewIndex, setPreviewIndex] = useState(-1);

  const fetchGuide = useCallback(async () => {
    const data = await service.dataService.guideDataService.getGuide(entity.levelLogicId);
    return data;
  }, [entity.levelLogicId]);

  useEffect(() => {
    queueMicrotask(() => {
      setGuide(null);
      void fetchGuide().then((data) => {
        if (data) setGuide(data);
      });
    });
  }, [fetchGuide]);

  const { sources, imageIndexMap } = collectImages(guide?.nodes ?? []);

  const handleImagePress = useCallback((index: number) => {
    setPreviewIndex(index);
  }, []);

  if (!guide || guide.nodes.length === 0) return null;

  return (
    <View>
      {guide.nodes.map((node, index) => (
        <GuideNode key={index} node={node} onImagePress={handleImagePress} imageIndexMap={imageIndexMap} />
      ))}

      <Modal visible={previewIndex >= 0} transparent animationType="fade" onRequestClose={() => setPreviewIndex(-1)}>
        <Pressable className="flex-1 items-center justify-center bg-black/80" onPress={() => setPreviewIndex(-1)}>
          {previewIndex >= 0 && sources[previewIndex] && (
            <View className="w-full px-4">
              <Image
                source={{ uri: sources[previewIndex] }}
                className="aspect-square w-full rounded-xl"
                resizeMode="contain"
              />
              <Text className="mt-4 text-center text-sm text-white/60">
                {previewIndex + 1} / {sources.length}
              </Text>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
