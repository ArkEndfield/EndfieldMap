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

export interface GuideNodeNode {
  type: 'node';
  nodes: GuideNodeType[];
}

export type GuideNodeType = GuideTextNode | GuideImageNode | GuideNodeNode;

export interface GuideInfoDetail {
  nodes: GuideNodeType[];
  video: {
    link?: string | null;
  };
}
