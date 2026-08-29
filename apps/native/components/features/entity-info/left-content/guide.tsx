import type { CustomPointData, ElectricPoleData, EntityData } from '@endfieldmap/map-core';
import type { GuideInfo } from '@endfieldmap/map-service';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';

import { service } from '@/services/map-service';

interface GuideProps {
  entity: EntityData | CustomPointData | ElectricPoleData;
}

/**
 * 实体攻略卡：消费 GET /api/v1/guides/:id 的真实形状（扁平 GuideInfo：
 * description 文本 + images（base64 dataURL 数组）+ video_links）。
 */
export function Guide({ entity }: GuideProps) {
  const [guide, setGuide] = useState<GuideInfo | null>(null);
  const [previewIndex, setPreviewIndex] = useState(-1);

  const fetchGuide = useCallback(async () => {
    return service.dataService.guideDataService.getGuide(entity.levelLogicId);
  }, [entity.levelLogicId]);

  useEffect(() => {
    queueMicrotask(() => {
      setGuide(null);
      void fetchGuide().then((data) => {
        if (data) setGuide(data);
      });
    });
  }, [fetchGuide]);

  const images = guide?.images ?? [];

  const handleImagePress = useCallback((index: number) => {
    setPreviewIndex(index);
  }, []);

  if (!guide || (images.length === 0 && !guide.description)) return null;

  return (
    <View className="gap-2">
      {guide.description ? (
        <Text className="text-sm leading-5 text-[#c8c8c8]">{guide.description}</Text>
      ) : null}

      {images.map((src, index) => (
        <Pressable key={index} onPress={() => handleImagePress(index)}>
          <Image
            source={{ uri: src }}
            className="w-full rounded-xl"
            resizeMode="contain"
          />
        </Pressable>
      ))}

      <Modal visible={previewIndex >= 0} transparent animationType="fade" onRequestClose={() => setPreviewIndex(-1)}>
        <Pressable className="flex-1 items-center justify-center bg-black/80" onPress={() => setPreviewIndex(-1)}>
          {previewIndex >= 0 && images[previewIndex] && (
            <View className="w-full px-4">
              <Image
                source={{ uri: images[previewIndex] }}
                className="aspect-square w-full rounded-xl"
                resizeMode="contain"
              />
              <Text className="mt-4 text-center text-sm text-white/60">
                {previewIndex + 1} / {images.length}
              </Text>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
