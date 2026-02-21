import type { InvestigateData } from '@endfieldmap/map-service/@types/note';
import { AssetService } from '@endfieldmap/map-service/service/asset';
import { type JSONLoader } from '@endfieldmap/tools';
import { action, observable } from 'mobx';

export interface NoteDataConfig {
  jsonLoader: JSONLoader;
  assetService: AssetService;
}

export class NoteDataService {
  private jsonLoader: JSONLoader;
  private assetService: AssetService;
  @observable
  accessor investigateData!: InvestigateData;

  constructor(config: NoteDataConfig) {
    this.jsonLoader = config.jsonLoader;
    this.assetService = config.assetService;
  }

  @action
  public async init() {
    const investigateDataUrl = `${this.assetService.url.entityData}/prts_investigate_tmpl.json`;
    const investigateData = await this.jsonLoader.loadJSON<InvestigateData>(investigateDataUrl);
    this.investigateData = investigateData;
  }
}
