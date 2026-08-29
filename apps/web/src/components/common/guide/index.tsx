import type { CustomPointData, ElectricPoleData, EntityData } from '@endfieldmap/map-core';
import { useGuide } from '@endfieldmap/map-hooks';
import { Logo, LogoLoading } from '@endfieldmap/web-components';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { type ControllerRef, type Slide } from 'yet-another-react-lightbox';

import { GuideUploadPanel } from '@/components/common/guide/upload_panel';
import { service } from '@/services';

const GuideLightbox = lazy(() => import('@/components/common/guide/lightbox'));

export const Guide = ({
  entity,
  onVideoLinkChange,
  onUnRefreshableChange,
}: {
  entity: EntityData | CustomPointData | ElectricPoleData;
  onVideoLinkChange: (videoLink: string) => void;
  onUnRefreshableChange: (unRefreshable: boolean) => void;
}) => {
  const { data: guide, loading, error } = useGuide(service, entity.levelLogicId);
  const [showImage, setShowImage] = useState(false);
  const [lightboxLoaded, setLightboxLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const imageRef = useRef<ControllerRef>(null);
  const handleImageClick = useCallback((imageIndex: number) => {
    setIndex(imageIndex);
    setLightboxLoaded(true);
    setShowImage(true);
  }, []);

  useEffect(() => {
    onVideoLinkChange(guide?.video_links?.[0] ?? '');
    onUnRefreshableChange(guide?.refreshable === '否');
  }, [guide, onVideoLinkChange, onUnRefreshableChange]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <LogoLoading className="text-[#81807f] text-base" />
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
    // 无 guide 数据时，仍允许已登录用户上传创建新的标点信息
    return <GuideUploadPanel entity={entity} guide={null} />;
  }

  // 构造Lightbox slides
  const slides: Slide[] = guide?.images?.map((src) => ({ src })) ?? [];

  return (
    <div className="flex flex-col gap-2 p-3 pr-6">
      {/* 文字描述在上方 */}
      <div className="text-sm whitespace-pre-line">{guide.description}</div>
      {/* 图片竖向排列 */}
      <div className="flex flex-col gap-2">
        {guide?.images?.map((src, idx) => (
          <div key={idx} className="group relative p-1 cursor-pointer" onClick={() => handleImageClick(idx)}>
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
      {/* 用户上传入口 */}
      <GuideUploadPanel entity={entity} guide={guide} />
      {/* 图片预览弹窗（首次打开时按需加载 Lightbox chunk） */}
      {lightboxLoaded && (
        <Suspense fallback={null}>
          <GuideLightbox
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
            styles={{
              button: {
                cursor: 'unset',
              },
            }}
          />
        </Suspense>
      )}
    </div>
  );
};
