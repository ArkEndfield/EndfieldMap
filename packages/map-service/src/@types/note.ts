import { MapData } from '@endfieldmap/map-core';

// 单个分类项接口
export interface CollectionIdItem {
  id: string;
  levelLogicId: number;
  name: string;
  desc: string;
}

export interface CategoryItem {
  name: string;
  collectionIdList: CollectionIdItem[];
}

// 单个研究项接口
export interface ResearchItem {
  id: string;
  name: string;
  desc: string;
  collectionIdList: CollectionIdItem[];
  categories: CategoryItem[];
}

// JSON 数据结构 (prts_investigate_tmpl.json)
export interface InvestigateData {
  mapId: MapData['id'];
  collections: ResearchItem[];
}
