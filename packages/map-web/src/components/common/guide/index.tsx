import 'yet-another-react-lightbox/styles.css';
import '@/components/common/guide/captions.css';
import '@/components/common/guide/thumbnails.css';

import type { CustomPointData, ElectricPoleData, EntityData } from '@endfieldmap/map-core';
import { useCallback, useRef, useState } from 'react';
import Lightbox, { type ControllerRef, type Slide } from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import { service } from '@/services';

import { useGuide } from '@endfieldmap/map-hooks';

export const Guide = ({ entity }: { entity: EntityData | CustomPointData | ElectricPoleData }) => {
  const { data: guide, loading, error } = useGuide(service, entity.levelLogicId);
  const [showImage, setShowImage] = useState(false);
  const [index, setIndex] = useState(0);
  const imageRef = useRef<ControllerRef>(null);

  const handleImageClick = useCallback((imageIndex: number) => {
    setIndex(imageIndex);
    setShowImage(true);
  }, []);

  if (loading) {
    return <div className="text-gray-500 text-sm py-4 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-sm py-4 text-center">Load Error</div>;
  }

  if (!guide) {
    return null;
  }

  // 构造Lightbox slides
  const slides: Slide[] = guide?.images?.map((src) => ({ src })) ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* 文字描述在上方 */}
      {guide?.description && (
        <div className="text-base text-gray-800 mb-2 whitespace-pre-line">{guide.description}</div>
      )}
      {/* 图片竖向排列 */}
      <div className="flex flex-col gap-2">
        {guide?.images?.map((src, idx) => (
          <img
            key={idx}
            src={src.startsWith('data:image') ? src : src}
            alt={`guide-img-${idx}`}
            className="max-w-full h-auto max-h-64 rounded-lg cursor-pointer hover:opacity-80 transition-opacity border"
            onClick={() => handleImageClick(idx)}
          />
        ))}
      </div>
      {/* 图片预览弹窗 */}
      <Lightbox
        index={index}
        controller={{
          ref: imageRef,
          closeOnPullDown: true,
          closeOnPullUp: true,
          closeOnBackdropClick: true,
        }}
        on={{
          view: ({ index }) => {
            setIndex(index);
          },
        }}
        animation={{ fade: 300 }}
        carousel={{ finite: true }}
        open={showImage}
        close={() => setShowImage(false)}
        slides={slides}
        plugins={[Captions, Fullscreen, Thumbnails, Zoom]}
        styles={{
          button: {
            cursor: 'unset',
          },
        }}
      />
    </div>
  );
};
