import type { ComponentType } from 'react';
import { lazy } from 'react';

import { BookIcon } from '@endfieldmap/web-components';

export interface CollectionTab {
  key: string;
  label: string;
  icon?: ComponentType;
  component: React.LazyExoticComponent<ComponentType<any>>;
}

export const COLLECTION_TABS: CollectionTab[] = [
  {
    key: 'note',
    label: '情报采集',
    icon: BookIcon,
    component: lazy(() => import('./items/note')),
  },
  {
    key: 'resource_map',
    label: '资源采集地图总览',
    component: lazy(() => import('./items/temp')),
  },
  // {
  //   key: 'building',
  //   label: '建筑图鉴与蓝图管理',
  //   component: lazy(() => import('./items/temp')),
  // },
  // {
  //   key: 'character',
  //   label: '角色档案资料库',
  //   component: lazy(() => import('./items/temp')),
  // },
  // {
  //   key: 'equipment',
  //   label: '装备与模组手册',
  //   component: lazy(() => import('./items/temp')),
  // },
  // {
  //   key: 'event',
  //   label: '事件记录与时间线',
  //   component: lazy(() => import('./items/temp')),
  // },
  // {
  //   key: 'tech_tree',
  //   label: '科技树研发路径',
  //   component: lazy(() => import('./items/temp')),
  // },
  // {
  //   key: 'ecology',
  //   label: '生态环境监测报告',
  //   component: lazy(() => import('./items/temp')),
  // },
  // {
  //   key: 'energy',
  //   label: '能源网络拓扑分析',
  //   component: lazy(() => import('./items/temp')),
  // },
  // {
  //   key: 'defense',
  //   label: '防御工事部署方案',
  //   component: lazy(() => import('./items/temp')),
  // },
  // {
  //   key: 'logistics',
  //   label: '物流运输调度系统',
  //   component: lazy(() => import('./items/temp')),
  // },
  // {
  //   key: 'archive',
  //   label: '历史遗迹考古档案',
  //   component: lazy(() => import('./items/temp')),
  // },
];
