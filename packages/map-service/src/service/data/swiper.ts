import type { SwiperData } from '@endfieldmap/map-service/@types/swiper';
import type { ServerService } from '@endfieldmap/map-service/service/server';
import { logger } from '@endfieldmap/tools';
import { observable } from 'mobx';

export interface SwiperDataServiceConfig {
  serverService: ServerService;
}

export class SwiperDataService {
  @observable
  accessor data: SwiperData[] = [];

  private serverService: ServerService;

  constructor(config: SwiperDataServiceConfig) {
    this.serverService = config.serverService;
  }

  public async loadSwiperList() {
    try {
      const data = await this.serverService.apiGet<SwiperData[]>('/banners');
      this.data = data;
    } catch (error) {
      logger.error('Failed to load swiper data:', error);
    }
  }
}
