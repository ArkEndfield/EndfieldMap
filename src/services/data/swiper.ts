import { logger } from '@endfieldmap/tools';
import { observable } from 'mobx';

import type { SwiperConfig } from '@/@types/swiper';
// import { getBackendUrl } from '@/utils/url';

export class SwiperDataService {
  @observable accessor swiperConfig: SwiperConfig = {
    enable: false,
    list: [],
  };

  constructor() {
    this.loadSwiperConfig();
  }

  private async loadSwiperConfig() {
    // const url = getBackendUrl('/api/scroll');
    try {
      //   const data = await fetch(url).then((res) => res.json());
      const MOCK_DATA: SwiperConfig = {
        enable: true,
        list: [
          {
            cid: 1,
            cover: 'https://i2.hdslb.com/bfs/archive/bc5adc7f91411ca17231ad00d980d932282f0c67.jpg@672w_378h_1c_!web-search-common-cover.avif',
            link: 'https://www.bilibili.com/video/BV1knSGBcEWM',
            title: '【明日方舟:终末地】带你了解终末地三测的养成与付费',
            type: '1',
          },
          {
            cid: 2,
            cover: 'https://i2.hdslb.com/bfs/archive/bc5adc7f91411ca17231ad00d980d932282f0c67.jpg@672w_378h_1c_!web-search-common-cover.avif',
            link: 'https://www.bilibili.com/video/BV1knSGBcEWM',
            title: '【明日方舟:终末地】带你了解终末地三测的养成与付费',
            type: '1',
          },
        ],
      };
      const data = MOCK_DATA;
      this.swiperConfig = data;
    } catch (error) {
      logger.error('Failed to load swiper data:', error);
    }
  }
}
