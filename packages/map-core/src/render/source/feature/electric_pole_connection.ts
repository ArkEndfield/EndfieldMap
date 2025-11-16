import { ConnectionFeature, type ConnectionFeatureConfig } from "@endfieldmap/map-core/render/source/feature/feature";

export interface ElectricPoleFeatureConfig extends ConnectionFeatureConfig {
}

export class ElectricPoleConnectionFeature extends ConnectionFeature {
    constructor(config: ElectricPoleFeatureConfig) {
        super(config);
    }
}