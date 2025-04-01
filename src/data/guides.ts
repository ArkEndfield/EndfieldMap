import { allPoints } from './points';

export interface GuideTextNode {
  type: 'text';
  text: string;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
}
export interface GuideImageNode {
  type: 'image';
  src: string;
}
export type NodeType = {
  type: 'node';
  nodes: (GuideTextNode | GuideImageNode | NodeType)[];
};

export interface GuideInfoDetail {
  nodes: NodeType[];
  video: {
    link: string;
  };
}

export type GuideInfo = Record<string | number, GuideInfoDetail>;

export const guides: GuideInfo = {};

// 初始化指南数据
export function initializeGuides() {
  // 清空现有数据
  Object.keys(guides).forEach(key => {
    delete guides[key];
  });

  // 根据点位数据初始化指南
  allPoints.forEach(point => {
    const { seq } = point;
    if (!guides[seq]) {
      guides[seq] = {
        nodes: [
          {
            type: 'node',
            nodes: [
              {
                type: 'text',
                text: point.entityDataIdKey,
                color: '#ff0',
              },
              {
                type: 'text',
                text: '标点',
              },
            ],
          },
          {
            type: 'node',
            nodes: [
              {
                type: 'image',
                src: '/images/loading_bg.jpg',
              },
            ],
          },
        ],
        video: {
          link: 'https://www.bilibili.com/video/BV1JUovYjEJQ',
        },
      };
    }
  });
}
