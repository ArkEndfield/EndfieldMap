import { logger } from '@endfieldmap/tools';
import { observable } from 'mobx';

import type { SwiperConfig } from '@/@types/swiper';
import { getBackendUrl } from '@/utils/url';

export class SwiperDataService {
  @observable accessor swiperConfig: SwiperConfig = {
    enable: false,
    list: [],
  };

  constructor() {
    this.loadSwiperConfig();
  }

  private async loadSwiperConfig() {
    const url = getBackendUrl('/api/scroll');
    try {
      const data = await fetch(url).then((res) => res.json());
      this.swiperConfig = data;
    } catch (error) {
      const MOCK_DATA: SwiperConfig = {
        enable: true,
        list: [
          {
            cid: 1,
            cover: 'https://i2.hdslb.com/bfs/archive/6c175300d3a2d44fe319860f23ec690bd51c09cb.jpg',
            link: 'https://www.bilibili.com/video/BV1rR29BMEEH',
            title: '【三测全收集一条龙】明日方舟:终末地 四号谷地全收集(更新至源石副产物中心)宝箱丨醚质',
            type: '1',
          },
        ],
      };
      this.swiperConfig = MOCK_DATA;
      logger.error('Failed to load swiper data:', error);
    }
  }
}
