import { Map } from 'ol';
import { cancelRafTimeout, rafTimeout } from '@/utils/animationTimer';

// 渲染状态类型
type RenderState = {
  animationId: number | null;
  isMoving: boolean;
  lowQualityMode: boolean;
};

// 渲染性能优化器
export class RenderOptimizer {
  private map: Map;
  private state: RenderState = {
    animationId: null,
    isMoving: false,
    lowQualityMode: false,
  };

  constructor(map: Map) {
    this.map = map;
    this.setupListeners();
  }

  private setupListeners(): void {
    // 监听地图移动开始事件
    this.map.on('movestart', () => {
      this.state.isMoving = true;
      this.enableLowQualityMode();
    });

    // 监听地图移动结束事件
    this.map.on('moveend', () => {
      this.state.isMoving = false;

      // 延迟恢复高质量模式，避免频繁切换
      if (this.state.animationId !== null) {
        cancelRafTimeout(this.state.animationId);
      }

      this.state.animationId = rafTimeout(() => {
        this.disableLowQualityMode();
        this.state.animationId = null;
      }, 200);
    });
  }

  // 切换到低质量模式
  private enableLowQualityMode(): void {
    if (this.state.lowQualityMode) return;

    this.state.lowQualityMode = true;

    // 临时降低图层分辨率以提高性能
    this.map.getAllLayers().forEach(layer => {
      // 保存原始属性
      if (
        layer.get('renderBuffer') !== undefined &&
        !layer.get('originalRenderBuffer')
      ) {
        layer.set('originalRenderBuffer', layer.get('renderBuffer'));
        // 降低渲染缓冲区大小以提高性能
        layer.set('renderBuffer', 1);
      }

      // 降低图层不透明度，减少渲染负担
      if (!layer.get('originalOpacity')) {
        layer.set('originalOpacity', layer.getOpacity());
        // 移动中略微降低不透明度
        if (layer.get('type') === 'vector') {
          layer.setOpacity(0.8);
        }
      }

      // 可选：暂时禁用某些复杂的图层
      if (layer.get('highCpuUsage') && layer.getVisible()) {
        layer.set('wasVisible', layer.getVisible());
        layer.setVisible(false);
      }
    });
  }

  // 恢复高质量模式
  private disableLowQualityMode(): void {
    if (!this.state.lowQualityMode) return;

    this.state.lowQualityMode = false;

    // 恢复原始设置
    this.map.getAllLayers().forEach(layer => {
      // 恢复原始渲染缓冲区
      const originalBuffer = layer.get('originalRenderBuffer');
      if (originalBuffer !== undefined) {
        layer.set('renderBuffer', originalBuffer);
      }

      // 恢复原始不透明度
      const originalOpacity = layer.get('originalOpacity');
      if (originalOpacity !== undefined) {
        layer.setOpacity(originalOpacity);
      }

      // 恢复隐藏的图层
      if (layer.get('highCpuUsage')) {
        const wasVisible = layer.get('wasVisible');
        if (wasVisible !== undefined) {
          layer.setVisible(wasVisible);
        }
      }
    });
  }

  // 清理资源
  public dispose(): void {
    if (this.state.animationId !== null) {
      cancelRafTimeout(this.state.animationId);
    }

    // 移除事件监听器
    this.map.un('movestart', this.enableLowQualityMode);
    this.map.un('moveend', this.disableLowQualityMode);
  }

  // 标记高CPU使用率的图层
  public markLayerAsHighCpuUsage(
    layerId: string,
    isHighUsage: boolean = true
  ): void {
    const layers = this.map.getAllLayers();
    const targetLayer = layers.find(layer => layer.get('id') === layerId);
    if (targetLayer) {
      targetLayer.set('highCpuUsage', isHighUsage);
    }
  }
}
