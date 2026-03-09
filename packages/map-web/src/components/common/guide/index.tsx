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
import { Logo, LogoLoading } from '@endfieldmap/web-components';

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
    return (
      <div className="flex justify-center py-4">
        <LogoLoading className="text-[#81807f]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-4 gap-2">
        <Logo className="text-red-500" />
        <span className="text-red-500 text-xs text-center">{error.message}</span>
      </div>
    );
  }

  if (!guide) {
    return null;
  }

  // 构造Lightbox slides
  const slides: Slide[] = guide?.images?.map((src) => ({ src })) ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* 文字描述在上方 */}
      <div className="text-lg lg:text-sm mb-2 whitespace-pre-line">{guide.description}</div>
      {/* 图片竖向排列 */}
      <div className="flex flex-col gap-2">
        {guide?.images?.map((src, idx) => (
          <div
            key={idx}
            className="group relative p-1 cursor-pointer"
            onClick={() => handleImageClick(idx)}
          >
            {/* Top-left corner accent */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-colors duration-200 border-white group-hover:border-yellow-400" />
            {/* Bottom-right corner accent */}
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-colors duration-200 border-white group-hover:border-yellow-400" />
            {/* Top-right corner accent */}
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 transition-colors duration-200 border-white group-hover:border-yellow-400" />
            {/* Bottom-left corner accent */}
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 transition-colors duration-200 border-white group-hover:border-yellow-400" />
            <img
              src={src.startsWith('data:image') ? src : src}
              alt={`guide-img-${idx}`}
              className="max-w-full h-auto max-h-64 hover:opacity-90 transition-opacity"
            />
          </div>
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
