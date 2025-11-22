import { dataService } from '@/services/data';
import type { GuideInfoDetail, GuideNodeType } from '@eftypes/guide';
import type { EntityData } from '@endfieldmap/map-core';
import { useCallback, useEffect, useRef, useState } from 'react';
import Lightbox, { type ControllerRef, type Slide } from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import { GuideNode } from './node';

import "yet-another-react-lightbox/styles.css";
import "./captions.css";
import "./thumbnails.css";

const collectImages = (nodes: GuideNodeType[]) => {
  const slides: Slide[] = [];
  const imageIndexMap = new Map<GuideNodeType, number>();
  let globalTextBuffer: string[] = [];

  const processNodes = (nodeList: GuideNodeType[]) => {
    for (const node of nodeList) {
      if (node.type === 'text') {
        globalTextBuffer.push(node.text);
      } else if (node.type === 'image') {
        const isBase64 = node.src.startsWith('data:image');
        const description = globalTextBuffer.join('');
        imageIndexMap.set(node, slides.length);
        slides.push({
          src: isBase64 ? node.src : `/images/guides/e0m2_3_flashback_008.png`,
          description: description || undefined,
        });
        globalTextBuffer = [];
      } else if (node.type === 'node') {
        processNodes(node.nodes);
      }
    }
  };

  processNodes(nodes);
  return { slides, imageIndexMap };
};

export const Guide = ({ entity }: { entity: EntityData }) => {
  const [guide, setGuide] = useState<GuideInfoDetail | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [index, setIndex] = useState(0);
  const imageRef = useRef<ControllerRef>(null);

  const getGuideData = useCallback(async () => {
    const guides = await dataService.guideDataService.getGuide(entity.levelLogicId);
    return guides;
  }, [entity]);

  const { slides, imageIndexMap } = collectImages(guide?.nodes ?? []);

  const handleImageClick = useCallback((imageIndex: number) => {
    setIndex(imageIndex);
    setShowImage(true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuide(null);
    getGuideData().then((data) => {
      if (data) {
        setGuide(data);
      }
    });
  }, [getGuideData]);

  return (
    <div>
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
            cursor: 'unset'
          }
        }}
      />
      {guide?.nodes.map((node, index) => (
        <GuideNode key={index} node={node} onImageClick={handleImageClick} imageIndexMap={imageIndexMap} />
      ))}
    </div>
  );
};
