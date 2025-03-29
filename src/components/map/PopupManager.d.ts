import { PointData } from '../../data/points';
import { Ref } from 'vue';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';

export declare class PopupManager {
  constructor(
    map: Map,
    overlay: Overlay,
    popupContainer: HTMLElement,
    isPopupVisible: Ref<boolean>,
    entity: Ref<PointData>,
    showVideoInfo: Ref<boolean>,
    openSubPopup: Ref<boolean>
  );

  closeToast(): void;
  toggleVideoInfo(show: boolean): void;
  toggleSubPopup(): void;
  onEnterPopup(el: Element, onComplete: () => void): Promise<void>;
  onLeavePopup(el: Element, onComplete: () => void): Promise<void>;
  onTransitionEnd(event: TransitionEvent): void;
  closeAndReopenPopup(data: PointData, newPosition: number[]): Promise<void>;
  adjustMapForPopup(
    map: Map,
    position: number[],
    callback?: () => void
  ): Promise<void>;
  adjustPopupPosition(forceAdjust?: boolean): void;
  adjustForExpandedPopup(isExpanded: boolean): Promise<void>;
  setCurrentPosition(position: number[] | undefined): void;
  getCurrentPosition(): number[] | undefined;
}
