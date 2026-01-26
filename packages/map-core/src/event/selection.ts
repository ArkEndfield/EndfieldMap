import { MAP_EVENT } from '@endfieldmap/map-core/const/event';
import { EntityInstanceKey, FeatureType, FeatureTypeKey } from '@endfieldmap/map-core/const/map';
import mapEventEmitter from '@endfieldmap/map-core/event/emitter';
import { EndfieldMap } from '@endfieldmap/map-core/render/olmap';
import type { DataInstance } from '@endfieldmap/map-core/types/event';
import type { DisposeListener, EntityEventDetail } from '@endfieldmap/map-core/types/event';
import { action, observable } from 'mobx';
import type { Feature } from 'ol';
import { platformModifierKeyOnly } from 'ol/events/condition';
import { getWidth } from 'ol/extent';
import type { Geometry } from 'ol/geom';
import { DragBox, Select } from 'ol/interaction';
import type VectorLayer from 'ol/layer/Vector';
import { Cluster } from 'ol/source';
import VectorSource from 'ol/source/Vector';

export class EndfieldSelectionInteraction {
  @observable accessor isSelecting: boolean = false;
  @observable accessor selectedFeatures: Feature<Geometry>[] = [];
  private _disposeEntityClickListener?: DisposeListener;
  public select: Select;
  public dragBox: DragBox;

  constructor() {
    this.select = new Select({
      multi: true,
      condition: () => false,
      style: null,
    });

    this.dragBox = new DragBox({
      condition: (e) => this.isSelecting && platformModifierKeyOnly(e),
      className: 'ol-dragbox',
    });

    this.initDragBox();
    this.initSelectionListener();
    this.initClickListener();
  }

  private initSelectionListener() {
    const updateSelection = () => {
      this.updateMapFeatureSelection();
      this.syncSelectedFeatures();
    };
    this.select.getFeatures().on('add', updateSelection);
    this.select.getFeatures().on('remove', updateSelection);
  }

  @action
  private syncSelectedFeatures() {
    this.selectedFeatures = this.select.getFeatures().getArray();
  }

  private initClickListener() {
    this._disposeEntityClickListener = mapEventEmitter.on(MAP_EVENT.ENTITY_CLICK, (detail: EntityEventDetail) => {
      if (this.isSelecting) {
        this.toggleFeatureSelection(detail.feature as Feature<Geometry>, true);
      }
    });
  }

  /**
   * 从features中提取所有底层单个features（处理聚合）
   */
  private collectSingleFeatures(features: Feature<Geometry>[]): Set<Feature<Geometry>> {
    const singleFeatures = new Set<Feature<Geometry>>();
    features.forEach((feature) => {
      const underlying = feature.get('features');
      if (Array.isArray(underlying)) {
        underlying.forEach((f: Feature<Geometry>) => singleFeatures.add(f));
      } else {
        singleFeatures.add(feature);
      }
    });
    return singleFeatures;
  }

  /**
   * 获取图层的实际VectorSource（处理Cluster）
   */
  private getActualSource(source: VectorSource | Cluster | null): VectorSource | null {
    if (!source) return null;
    if (source instanceof Cluster) {
      return source.getSource() as VectorSource;
    }
    return source instanceof VectorSource ? source : null;
  }

  private updateMapFeatureSelection() {
    const map = EndfieldMap.getInstance().map;

    const selectedSingleFeatures = this.collectSingleFeatures(this.select.getFeatures().getArray());

    map.getAllLayers().forEach((layer) => {
      if (!('getSource' in layer)) return;
      const source = this.getActualSource((layer as VectorLayer<VectorSource>).getSource());
      if (!source?.getFeatures) return;

      source.getFeatures().forEach((feature: Feature<Geometry>) => {
        const dataInstance = feature.get(EntityInstanceKey) as DataInstance | undefined;
        dataInstance?.setSelected?.(selectedSingleFeatures.has(feature));
      });
    });
  }

  private initDragBox() {
    this.dragBox.on('boxstart', () => this.select.getFeatures().clear());
    this.dragBox.on('boxend', () => this.handleDragBoxEnd());
  }

  private handleDragBoxEnd() {
    const map = EndfieldMap.getInstance().map;

    const boxExtent = this.dragBox.getGeometry().getExtent();
    const view = map.getView();
    const rotation = view.getRotation();
    const oblique = rotation % (Math.PI / 2) !== 0;

    const worldExtent = view.getProjection().getExtent();
    const worldWidth = getWidth(worldExtent);
    const startWorld = Math.floor((boxExtent[0] - worldExtent[0]) / worldWidth);
    const endWorld = Math.floor((boxExtent[2] - worldExtent[0]) / worldWidth);

    for (let world = startWorld; world <= endWorld; ++world) {
      const extent = [
        Math.max(boxExtent[0] - world * worldWidth, worldExtent[0]),
        boxExtent[1],
        Math.min(boxExtent[2] - world * worldWidth, worldExtent[2]),
        boxExtent[3],
      ];

      this.selectFeaturesInExtent(extent, oblique, rotation, world, worldWidth);
    }
  }

  private selectFeaturesInExtent(
    extent: number[],
    oblique: boolean,
    rotation: number,
    world: number,
    worldWidth: number
  ) {
    const map = EndfieldMap.getInstance().map;
    map.getAllLayers().forEach((layer) => {
      if (!('getSource' in layer)) return;

      // 跳过不可见的图层
      if (!layer.getVisible()) return;

      const layerSource = (layer as VectorLayer<VectorSource>).getSource();
      if (!layerSource?.getFeaturesInExtent) return;

      // 从图层数据源获取 features（可能是聚簇 features）
      const boxFeatures = layerSource.getFeaturesInExtent(extent).filter((feature: Feature<Geometry>) => {
        const geometry = feature.getGeometry();
        if (!geometry?.intersectsExtent?.(extent)) return false;

        // 检查是否有底层 feature 可选择
        const underlyingFeatures = feature.get('features') as Feature<Geometry>[] | undefined;
        if (underlyingFeatures) {
          // 聚簇 feature：检查聚簇中是否有任何可选择的 feature
          return underlyingFeatures.some((f) => {
            // 必须是 ENTITY 类型
            if (f.get(FeatureTypeKey) !== FeatureType.ENTITY) return false;
            const dataInstance = f.get(EntityInstanceKey) as DataInstance | undefined;
            return !dataInstance || !!dataInstance.selectable;
          });
        } else {
          // 单个 feature：必须是 ENTITY 类型且可选择
          if (feature.get(FeatureTypeKey) !== FeatureType.ENTITY) return false;
          const dataInstance = feature.get(EntityInstanceKey) as DataInstance | undefined;
          return !dataInstance || !!dataInstance.selectable;
        }
      });

      if (oblique) {
        this.selectObliqueFeatures(boxFeatures, rotation, world, worldWidth);
      } else {
        // addFeatureToSelection 会处理展开聚簇 features
        boxFeatures.forEach((f) => this.addFeatureToSelection(f));
      }
    });
  }

  private selectObliqueFeatures(features: Feature<Geometry>[], rotation: number, world: number, worldWidth: number) {
    const anchor = [0, 0];
    const geometry = this.dragBox.getGeometry().clone();
    geometry.translate(-world * worldWidth, 0);
    geometry.rotate(-rotation, anchor);
    const rotatedExtent = geometry.getExtent();

    features.forEach((feature) => {
      const featureGeometry = feature.getGeometry();
      if (!featureGeometry) return;

      const clonedGeometry = featureGeometry.clone();
      clonedGeometry.rotate(-rotation, anchor);
      if (clonedGeometry.intersectsExtent(rotatedExtent)) {
        this.addFeatureToSelection(feature);
      }
    });
  }

  /**
   * 添加feature到选中列表（自动展开聚合feature）
   */
  private addFeatureToSelection(feature: Feature<Geometry>) {
    const underlyingFeatures = this.getUnderlyingFeatures(feature);
    // 只有添加未被选中的且可选择的 features
    const selectedArray = this.select.getFeatures().getArray();
    underlyingFeatures.forEach((f) => {
      if (!selectedArray.includes(f)) {
        // 必须是 ENTITY 类型
        if (f.get(FeatureTypeKey) !== FeatureType.ENTITY) return;

        const dataInstance = f.get(EntityInstanceKey) as DataInstance | undefined;
        // 检查是否可选择
        if (!dataInstance?.selectable) return;

        this.select.getFeatures().push(f);
      }
    });
  }

  @action
  public startSelecting() {
    this.isSelecting = true;
    mapEventEmitter.fire(MAP_EVENT.SELECTION_START, undefined);
  }

  @action
  public stopSelecting() {
    this.isSelecting = false;
    this.clearSelection();
  }

  @action
  public toggleSelecting() {
    this.isSelecting = !this.isSelecting;
    if (!this.isSelecting) {
      this.clearSelection();
    }
  }

  public clearSelection() {
    this.select.getFeatures().clear();
  }

  public getSelectedFeatures() {
    return this.select.getFeatures();
  }

  /**
   * 获取feature的底层features（处理聚合）
   */
  private getUnderlyingFeatures(feature: Feature<Geometry>): Feature<Geometry>[] {
    const features = feature.get('features');
    return Array.isArray(features) ? features : [feature];
  }

  /**
   * 在选中列表中查找包含指定feature的项
   */
  private findSelectedFeature(feature: Feature<Geometry>): Feature<Geometry> | undefined {
    const selectedArray = this.select.getFeatures().getArray();
    const underlying = this.getUnderlyingFeatures(feature);

    return selectedArray.find((selected) => {
      if (selected === feature) return true;

      const selectedUnderlying = this.getUnderlyingFeatures(selected);

      // 如果底层features完全相同
      if (underlying.length === selectedUnderlying.length) {
        const set = new Set(underlying);
        return selectedUnderlying.every((f) => set.has(f));
      }

      // 如果选中的聚合包含当前feature
      if (underlying.length === 1) {
        return selectedUnderlying.includes(underlying[0]);
      }

      return false;
    });
  }

  /**
   * 切换 feature 的选中状态
   * 只处理可选择的 ENTITY feature
   */
  @action
  public toggleFeatureSelection(feature: Feature<Geometry>, multi: boolean = false) {
    if (!this.isSelecting) return;

    // 必须是 ENTITY 类型
    if (feature.get(FeatureTypeKey) !== FeatureType.ENTITY) return;

    // 检查是否可选择
    const dataInstance = feature.get(EntityInstanceKey) as DataInstance | undefined;
    if (!dataInstance?.selectable) return;

    const selectedFeatures = this.select.getFeatures();
    const matched = this.findSelectedFeature(feature);

    if (multi) {
      if (matched) {
        selectedFeatures.remove(matched);
      } else {
        selectedFeatures.push(feature);
      }
    } else {
      if (matched && selectedFeatures.getLength() === 1) {
        selectedFeatures.clear();
      } else {
        selectedFeatures.clear();
        selectedFeatures.push(feature);
      }
    }
  }

  /**
   * 选中 feature
   * 只处理可选择的 ENTITY feature
   */
  @action
  public selectFeature(feature: Feature<Geometry>, clearOthers: boolean = true) {
    if (!this.isSelecting) return;

    // 必须是 ENTITY 类型
    if (feature.get(FeatureTypeKey) !== FeatureType.ENTITY) return;

    // 检查是否可选择
    const dataInstance = feature.get(EntityInstanceKey) as DataInstance | undefined;
    if (!dataInstance?.selectable) return;

    const selectedFeatures = this.select.getFeatures();
    if (clearOthers) {
      selectedFeatures.clear();
    }

    if (!this.findSelectedFeature(feature)) {
      selectedFeatures.push(feature);
    }
  }

  /**
   * 取消选中feature
   */
  @action
  public deselectFeature(feature: Feature<Geometry>) {
    const matched = this.findSelectedFeature(feature);
    if (matched) {
      this.select.getFeatures().remove(matched);
    }
  }

  /**
   * 销毁实例
   */
  @action
  public destroy() {
    this._disposeEntityClickListener?.();
    this._disposeEntityClickListener = undefined;
    this.clearSelection();
  }
}
