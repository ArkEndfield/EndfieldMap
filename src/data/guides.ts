import { getAllPoints } from './points';

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

// 初始化指南数据 - 确保返回Promise
export async function initializeGuides() {
  try {
    // 清空现有数据
    Object.keys(guides).forEach(key => {
      delete guides[key];
    });

    // 获取所有点位数据
    const allPoints = await getAllPoints();
    console.log(`初始化指南数据，处理 ${allPoints.length} 个点位`);

    // 根据点位数据初始化指南
    allPoints.forEach(point => {
      const { levelLogicId } = point;
      if (!guides[levelLogicId]) {
        guides[levelLogicId] = {
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

    console.log(
      `指南数据初始化完成，共创建 ${Object.keys(guides).length} 条指南`
    );
    return guides;
  } catch (error) {
    console.error('初始化指南数据失败:', error);
    throw error; // 确保错误能传播到调用者
  }
}
