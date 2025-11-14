import { MultiLayerBase } from "@endfieldmap/map-core/render/layers/_base";
import type { CommonPointEntityLayer } from "@endfieldmap/map-core/render/layers/entity/common_point";
import type BaseLayer from "ol/layer/Base";

/**
 * 实体图层容器
 * 用于管理多个实体图层
 */
export class EntityLayerContainer extends MultiLayerBase {
    /** 图层实例集合 */
    public layers: BaseLayer[];
    /** 实体图层列表 */
    public entityLayers: CommonPointEntityLayer[];

    constructor(entityLayers: CommonPointEntityLayer[]) {
        super();
        this.entityLayers = entityLayers;
        this.layers = entityLayers.map(layer => layer.layer);
    }
}

