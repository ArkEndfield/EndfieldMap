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
  nodes: (GuideTextNode | GuideImageNode)[];
}

export type GuideNode = GuideTextNode | GuideImageNode | GuideNodeNode;

export type NodeType = {
  type: 'node';
  nodes: (GuideTextNode | GuideImageNode | NodeType)[];
};

export interface GuideInfoDetail {
  nodes: NodeType[];
  video: {
    link?: string | null;
  };
}

export type GuideInfo = Record<string | number, GuideInfoDetail>;
