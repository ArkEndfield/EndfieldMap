import type { IActiveFeatureController } from '@endfieldmap/map-core/interfaces/controllers';
import type { DataInstance } from '@endfieldmap/map-core/types/event';
import { action, observable } from 'mobx';

/**
 * MapLibre 激活特征控制器
 * 管理当前被激活（点击选中）的标点
 */
export class ActiveFeatureController implements IActiveFeatureController {
  @observable accessor activeFeature: DataInstance | null = null;

  /** 是否启用激活特征功能 */
  @observable accessor enabled = true;

  @action
  setActiveFeature(feature: DataInstance | null): void {
    if (!this.enabled) return;

    const oldFeature = this.activeFeature;
    if (oldFeature === feature) return;

    if (oldFeature) {
      oldFeature.setActive(false);
    }
    if (feature) {
      feature.setActive(true);
    }
    this.activeFeature = feature;
  }

  @action
  clearActiveFeature(): void {
    if (this.activeFeature) {
      this.activeFeature.setActive(false);
      this.activeFeature = null;
    }
  }

  @action
  setEnable(enable: boolean): void {
    this.enabled = enable;
    if (!enable) {
      this.clearActiveFeature();
    }
  }

  dispose(): void {
    this.clearActiveFeature();
  }
}
