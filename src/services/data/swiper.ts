// import { logger } from '@endfieldmap/tools';
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
    // try {
    //   const data = await fetch(url).then((res) => res.json());
    //   this.swiperConfig = data;
    // } catch (error) {
    //   logger.error('Failed to load swiper data:', error);
    // }
    const MOCK_DATA: SwiperConfig = {
      enable: true,
      list: [
        {
          cid: 1,
          cover: 'https://i0.hdslb.com/bfs/archive/979915354a9dabc24f0964b406bfbc4229013132.jpg',
          link: 'https://www.bilibili.com/video/BV1wfzWBBEEb',
          title: '【终末地一条龙全收集】四号谷地-枢纽区丨宝箱丨醚质丨故障机器人',
          type: '1',
        },
        {
          cid: 2,
          cover: 'https://i0.hdslb.com/bfs/archive/c68efd867aad56e55680e6c338485b74943ab3a2.jpg',
          link: 'https://www.end-axis.com/timeline',
          title: 'Endaxis - 《明日方舟：终末地》排轴工具',
          type: '1',
        },
        {
          cid: 3,
          cover: 'https://i0.hdslb.com/bfs/archive/48e12a8a25c0b2a9f827afdfcae58fc3659808bd.jpg',
          link: 'https://www.bilibili.com/video/BV1Edz6ByEKi',
          title: '【明日方舟:终末地】维修总动员全机器人维修合集丨故障机器人丨维修总动员丨拼图丨矿脉源区',
          type: '1',
        },
      ],
    };
    this.swiperConfig = MOCK_DATA;
  }
}
