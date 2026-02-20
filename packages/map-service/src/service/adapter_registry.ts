import type { EndfieldMapEmitter } from '@endfieldmap/map-core';
import type { IMapAdapter } from '@endfieldmap/map-core';

/**
 * 适配器注册时接受的类型
 * 具体适配器（如 OL）的 event 发射器使用渲染引擎特定的事件类型，
 * 但共享相同的事件 key（MAP_EVENT.*）且运行时完全兼容
 */
export type RegisterableAdapter = Omit<IMapAdapter, 'event'> & {
  readonly event: EndfieldMapEmitter;
};

export class AdapterRegistry {
  private _adapter: IMapAdapter | null = null;

  /**
   * 注册适配器实例
   * 将具体适配器的宽泛事件类型收窄为领域事件类型
   */
  register(adapter: RegisterableAdapter): void {
    this._adapter = adapter as IMapAdapter;
  }

  get adapter(): IMapAdapter {
    if (!this._adapter) {
      throw new Error('[AdapterRegistry] Adapter not registered. Call register() first.');
    }
    return this._adapter;
  }

  get hasAdapter(): boolean {
    return this._adapter !== null;
  }

  dispose(): void {
    this._adapter = null;
  }
}
