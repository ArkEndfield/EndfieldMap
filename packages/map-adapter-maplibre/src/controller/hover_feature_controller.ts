import type { IHoverFeatureController } from '@endfieldmap/map-core/interfaces/controllers';
import type { DataInstance } from '@endfieldmap/map-core/types/event';
import { observable } from 'mobx';

/**
 * MapLibre Hover 特征控制器
 * 在移动端 hover 行为不适用，此控制器提供空操作实现
 */
export class HoverFeatureController implements IHoverFeatureController {
  @observable accessor hoverFeature: DataInstance | null = null;

  clearHoverFeature(): void {
    this.hoverFeature = null;
  }

  setEnable(_enable: boolean): void {
    // native 端无 hover 行为
  }

  setDebounceTime(_time: number): void {
    // native 端无 hover 行为
  }

  dispose(): void {
    this.clearHoverFeature();
  }
}
