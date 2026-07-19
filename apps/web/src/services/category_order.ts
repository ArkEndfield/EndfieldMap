import { LocalStorageKey, LocalStorageValue } from '@endfieldmap/tools';

/** 默认排序表（与原 EntityPanel 内 hardcode 顺序一致） */
export const DEFAULT_CATEGORY_ORDER = [
  'disposable',
  'trchest',
  'rare_gather',
  'common_gather',
  'system',
  'enemy',
  'dnarrative',
  'narrative',
];

/** 侧边栏大分类本地自定义顺序（空数组 = 未自定义，使用默认表）。mobx observable，observer 组件读 value 即可响应 */
export const categoryOrderStorage = new LocalStorageValue<string[]>({
  storageKey: LocalStorageKey.SIDEBAR_CATEGORY_ORDER,
  initialValue: [],
});

const getEffectiveOrder = (): string[] =>
  categoryOrderStorage.value.length ? categoryOrderStorage.value : DEFAULT_CATEGORY_ORDER;

/**
 * 由分类集合得到显示顺序：去重后按当前生效顺序稳定排序。
 * 排序语义与原 hardcode 一致：不在表内的分类（indexOf=-1）排最前，彼此保持出现顺序。
 */
export function getDisplayedCategoryOrder(categories: string[]): string[] {
  const order = getEffectiveOrder();
  return [...new Set(categories)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/**
 * 保存一次新的显示顺序（拖拽 / 上移下移后调用）。
 * 本次未显示的历史分类（如其他地图独有的）追加在末尾，保留其相对顺序。
 */
export function applyDisplayedOrder(displayed: string[]): void {
  const displayedSet = new Set(displayed);
  const rest = getEffectiveOrder().filter((category) => !displayedSet.has(category));
  categoryOrderStorage.value = [...displayed, ...rest];
}

/** 将分类在给定显示顺序中上移（-1）/ 下移（1）一位并持久化 */
export function moveDisplayedCategory(displayed: string[], category: string, direction: -1 | 1): void {
  const from = displayed.indexOf(category);
  const to = from + direction;
  if (from === -1 || to < 0 || to >= displayed.length) return;
  const next = [...displayed];
  next.splice(from, 1);
  next.splice(to, 0, category);
  applyDisplayedOrder(next);
}
