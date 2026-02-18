import { type JSONLoader } from '@endfieldmap/tools';
import { action, observable } from 'mobx';

import type { InvestigateData } from '@/@types/note';
import { service } from '@/services';

const assetURL = service.assetService.url;

export class NoteDataService {
  private jsonLoader: JSONLoader;
  @observable accessor investigateData!: InvestigateData;

  constructor(jsonLoader: JSONLoader) {
    this.jsonLoader = jsonLoader;
  }

  @action
  public async init() {
    const investigateDataUrl = `${assetURL.entityData}/prts_investigate_tmpl.json`;
    const investigateData = await this.jsonLoader.loadJSON<InvestigateData>(investigateDataUrl);
    this.investigateData = investigateData;
  }
}
