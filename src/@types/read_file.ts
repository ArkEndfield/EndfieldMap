// 单个分类项接口
export interface CategoryItem {
  name: string;
  collectionIdList: string[];
}

// 单个研究项接口
export interface ResearchItem {
  id: string;
  name: string;
  desc: string;
  collectionIdList: string[];
  categories: CategoryItem[];
}

// JSON 数据结构 (prts_investigate_tmpl.json)
export interface InvestigateData {
  domain_1: ResearchItem[];
  domain_2: ResearchItem[];
}

export interface ReadFileItem {
  id: string;
  name: string;
  icon: string;
  translatedName: string;
  value: string;
}
