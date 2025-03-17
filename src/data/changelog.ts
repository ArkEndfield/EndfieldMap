export interface Changelog {
  date: string;
  changes: string[];
}

const changelog: Changelog[] = [
  {
    date: '2025-03-17',
    changes: [
      '优化部分国际化',
      '增加UP卡片',
      '新增更新日志功能',
      '增加光标样式',
      '微调 Popover 样式',
      '更新菜单样式，适配移动端',
      '国际化初步支持',
      '优化地图参数',
      '更新醚质坐标',
      '新增侧边箭头展开',
    ],
  },
  {
    date: '2025-03-16',
    changes: [
      '增加菜单栏',
      '增加地图控制器',
      '更新醚质坐标',
      '更新弹出层过渡动画',
    ],
  },
  {
    date: '2025-03-15',
    changes: ['微调侧边栏样式，适配大小', '更新素材资源', '完善项目构建配置'],
  },
  {
    date: '2025-03-14',
    changes: ['实现侧边栏UI'],
  },
  {
    date: '2025-02-16',
    changes: ['完善标点框架', '使用 OpenLayers 作为地图引擎'],
  },
  {
    date: '2025-02-14',
    changes: ['初始化项目'],
  },
];

export default changelog;
