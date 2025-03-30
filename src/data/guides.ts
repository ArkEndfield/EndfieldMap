import { points } from './points';

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
  nodes: (GuideTextNode | GuideImageNode)[];
};

export interface GuideInfoDetail {
  nodes: NodeType[];
  video: {
    link: string;
  };
}

export type GuideInfo = Record<string | number, GuideInfoDetail>;

const initData = points.reduce((acc, point) => {
  const { seq } = point;
  if (!acc[seq]) {
    acc[seq] = {
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
  return acc;
}, {} as GuideInfo);

export const guides: GuideInfo = initData;
