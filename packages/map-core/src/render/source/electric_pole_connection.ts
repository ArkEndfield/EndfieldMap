import SourceBase, { type BaseSourceConfig } from '@endfieldmap/map-core/render/source/_base';
import { ConnectionFeature } from '@endfieldmap/map-core/render/source/feature/feature';

// export interface ElectricPoleConnectionSourceConfig extends BaseSourceConfig {
// }

export class ElectricPoleConnectionSource extends SourceBase<ConnectionFeature, BaseSourceConfig> {
  constructor(config: BaseSourceConfig) {
    super(config);
  }
}
