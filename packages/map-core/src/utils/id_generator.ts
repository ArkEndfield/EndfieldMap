export class IdGenerator {
  /**
   * 生成唯一的逻辑 ID
   * @param existingIds 已存在的 ID 集合
   * @param min 最小 ID (包含)
   * @param max 最大 ID (不包含)
   * @returns 新的唯一 ID
   */
  public static generate(existingIds: Set<number>, min: number, max: number): number {
    const range = max - min;
    if (range <= 0) {
      throw new Error('Invalid ID range');
    }

    // 防止死循环：如果 range 很小且都用完了
    if (existingIds.size >= range) {
      throw new Error('ID range exhausted');
    }

    while (true) {
      const newId = Math.floor(Math.random() * range) + min;
      if (!existingIds.has(newId)) {
        return newId;
      }
    }
  }
}
