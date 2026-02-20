import type { IHoverConnectionController } from '@endfieldmap/map-core';

/**
 * MapLibre Hover 连接控制器
 * 在移动端 hover 行为不适用，此控制器提供空操作实现
 */
export class HoverConnectionController implements IHoverConnectionController {
  clearHoverConnection(): void {
    // native 端无 hover 行为
  }

  setEnable(_enable: boolean): void {
    // native 端无 hover 行为
  }

  setDebounceTime(_time: number): void {
    // native 端无 hover 行为
  }

  dispose(): void {
    // 无需清理
  }
}
