import type { SwiperConfig } from '@eftypes/swiper';
import { observable } from 'mobx';

export class SwiperDataService {
  @observable accessor swiperConfig: SwiperConfig = {
    enable: false,
    list: [],
  };

  constructor() {
    this.loadSwiperConfig();
  }

  private async loadSwiperConfig() {
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
          cover: 'https://i0.hdslb.com/bfs/archive/1b24b6bdc017dcdb4abafa88af070c41577532ed.jpg',
          link: 'https://www.bilibili.com/video/BV1YhzkBzEjh',
          title: '【终末地一条龙全收集】武陵-景玉谷丨宝箱丨醚质丨故障机器人丨装备箱丨采录桩丨',
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
          cover: 'https://i0.hdslb.com/bfs/archive/979915354a9dabc24f0964b406bfbc4229013132.jpg',
          link: 'https://www.bilibili.com/video/BV1wfzWBBEEb',
          title: '【终末地一条龙全收集】四号谷地-枢纽区丨宝箱丨醚质丨故障机器人',
          type: '1',
        },
      ],
    };
    this.swiperConfig = MOCK_DATA;
  }
}
