/**
 * 根据对象的某个属性对数组进行分组
 * @param array 数组
 * @param key 属性名
 * @returns 分组后的对象
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

/**
 * 对象数组求并集
 * @param arr1 数组1
 * @param arr2 数组2
 * @param key 用于区分对象的唯一属性名 (如 'id')
 */
export function unionObjectArray<T>(arr1: T[], arr2: T[], key: keyof T): T[] {
  const map = new Map<T[typeof key], T>();
  [...arr1, ...arr2].forEach((item) => {
    map.set(item[key], item);
  });
  return Array.from(map.values());
}

/**
 * 对象数组求交集
 */
export function intersectionObjectArray<T>(arr1: T[], arr2: T[], key: keyof T): T[] {
  // 将 arr2 的 key 提取出来做成 Set，提高查找效率
  const set2 = new Set(arr2.map((item) => item[key]));

  // 过滤 arr1，且需去重 (利用 Map)
  const resultMap = new Map<T[typeof key], T>();
  arr1.forEach((item) => {
    // 这里的 key 需要转为 string 或 number 才能作为对象的 key，或者使用 Map
    if (set2.has(item[key])) {
      resultMap.set(item[key], item);
    }
  });
  return Array.from(resultMap.values());
}

/**
 * 对象数组求差集 (arr1 - arr2)
 */
export function differenceObjectArray<T>(arr1: T[], arr2: T[], key: keyof T): T[] {
  const set2 = new Set(arr2.map((item) => item[key]));

  // 使用 Map 去重 arr1 自身
  const map1 = new Map<T[typeof key], T>();
  arr1.forEach((item) => map1.set(item[key], item));
  const result: T[] = [];
  map1.forEach((item, k) => {
    if (!set2.has(k)) {
      result.push(item);
    }
  });
  return result;
}

// 定义基础类型别名，确保只传入非对象类型
type Primitive = string | number | boolean | null | undefined;

/**
 * 并集 (Union): A ∪ B
 * 含义：合并两个数组，并去除重复项
 */
export function unionArray<T extends Primitive>(arr1: T[], arr2: T[]): T[] {
  // 先合并，再用 Set 去重，最后转回数组
  return Array.from(new Set([...arr1, ...arr2]));
}

/**
 * 交集 (Intersection): A ∩ B
 * 含义：两个数组中都有的元素
 */
export function intersectionArray<T extends Primitive>(arr1: T[], arr2: T[]): T[] {
  // 将 arr2 转为 Set 以提高查找性能 (O(1))
  const set2 = new Set(arr2);
  // 对 arr1 去重后遍历，判断是否在 set2 中存在
  return Array.from(new Set(arr1)).filter((item) => set2.has(item));
}

/**
 * 差集 (Difference): A - B
 * 含义：在 A 中存在，但不在 B 中存在的元素
 */
export function differenceArray<T extends Primitive>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  // 对 arr1 去重后遍历，保留不在 set2 中的元素
  return Array.from(new Set(arr1)).filter((item) => !set2.has(item));
}

/**
 * 补集/对称差集 (Symmetric Difference): (A - B) ∪ (B - A)
 * 含义：只属于其中一个数组，而不属于两者的元素
 */
export function symmetricDifferenceArray<T extends Primitive>(arr1: T[], arr2: T[]): T[] {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  const diff1 = Array.from(set1).filter((x) => !set2.has(x));
  const diff2 = Array.from(set2).filter((x) => !set1.has(x));

  return [...diff1, ...diff2];
}
