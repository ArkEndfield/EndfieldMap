import SourceBase, { BaseSourceConfig } from "@endfieldmap/map-core/render/source/_base";
import { ConnectionFeature } from "@endfieldmap/map-core/render/source/feature/feature";

export interface ElectricPoleConnectionSourceConfig extends BaseSourceConfig {
}

export class ElectricPoleConnectionSource extends SourceBase<ConnectionFeature, ElectricPoleConnectionSourceConfig> {
  constructor(config: ElectricPoleConnectionSourceConfig) {
    super(config);
  }
}
