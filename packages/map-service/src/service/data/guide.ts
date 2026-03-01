import type { GuideInfo } from '@endfieldmap/map-service/@types/guide';
import type { ServerService } from '@endfieldmap/map-service/service/server';

export interface GuideDataServiceConfig {
  serverService: ServerService;
}

export class GuideDataService {
  private serverService: ServerService;

  constructor(config: GuideDataServiceConfig) {
    this.serverService = config.serverService as ServerService;
  }

  public async getGuide(id: number, options?: RequestInit): Promise<GuideInfo | null> {
    return this.serverService.apiGet<GuideInfo>(`/guides/${id}`, undefined, options);
  }
}
