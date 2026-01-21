import type { EntityInfoStats } from '@endfieldmap/map-core';
import { NoteKey } from '@endfieldmap/map-core';

import EntityGroup from '@themes/endfield/ui/control_panel/controllers/entity_panel/group';
import EntityItem from '@themes/endfield/ui/control_panel/controllers/entity_panel/item';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ReadFileItem } from '@eftypes/read_file';
import { useAdapter } from '@/hooks/use_adapter';

/**
 * 情报档案组件
 * 默认隐藏，仅在特定搜索条件时显示
 */
const ReadFileEntityGroup: React.FC<{ searchQuery: string }> = observer(({ searchQuery }) => {
  const { t } = useTranslation(['sidebar', 'lang']);
  const { dataService } = useAdapter();
  const data = dataService.readFileDataService.investigateData;

  // 处理数据：建立 collectionId 到 name 的映射，并准备搜索结果
  const itemsResult = useMemo((): { itemsMap: Map<string, ReadFileItem>; itemsList: ReadFileItem[] } => {
    if (!data) {
      return { itemsMap: new Map<string, ReadFileItem>(), itemsList: [] };
    }

    const map = new Map<string, ReadFileItem>();
    const list: ReadFileItem[] = [];

    // 遍历 domain_1 和 domain_2
    const domains = [...(data.domain_1 ?? []), ...(data.domain_2 ?? [])];

    domains.forEach((item) => {
      const { name, desc, categories } = item;

      // 遍历 categories 下的 collectionIdList，建立 collectionId 到 name 的映射
      categories.forEach((category) => {
        const { collectionIdList } = category;
        collectionIdList.forEach((collectionId) => {
          // 使用 lang 命名空间进行翻译
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const translatedName = (t as any)(`lang:${name}`, { defaultValue: name }) as string;
          const readFileItem: ReadFileItem = {
            id: collectionId,
            name,
            icon: 'item_read_file',
            translatedName,
            value: desc || '',
          };
          map.set(collectionId, readFileItem);
          list.push(readFileItem);
        });
      });
    });

    return { itemsMap: map, itemsList: list };
  }, [data, t]);

  const itemsMap = itemsResult.itemsMap;
  const itemsList = itemsResult.itemsList;

  // 搜索过滤：在 value 值中进行模糊搜索匹配
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query || query === '799') {
      return itemsList;
    }

    return itemsList.filter(
      (item: ReadFileItem) =>
        item.value.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.translatedName.toLowerCase().includes(query)
    );
  }, [searchQuery, itemsList]);

  // 点击处理
  const handleClick = useCallback((item: ReadFileItem) => {
    console.log('Clicked item:', item);
    // TODO: 添加点击后的逻辑
  }, []);

  // 检查是否满足显示条件
  const shouldShow = searchQuery.trim() === '799' || (searchQuery.trim() !== '' && filteredItems.length > 0);

  if (!shouldShow) {
    return null;
  }

  // 转换为兼容 EntityItem 的格式
  const entityItems: EntityInfoStats[] = filteredItems.map((item: ReadFileItem) => ({
    entityDataIdKey: item.name,
    uniqueKey: item.id,
    category: NoteKey,
    entityInfo: {
      point: item.name,
      pic: 'item_read_file',
      desc: item.value,
    },
    count: 1,
    markedCount: 0,
    visible: true,
  }));

  return (
    <EntityGroup title={t('filter.category.#read_file')} subtitle="READ FILE" iconColor="#ff6b6b">
      <div className="grid grid-cols-2 gap-x-1 gap-y-1.5 py-2">
        {entityItems.map((entity) => (
          <EntityItem
            key={entity.entityDataIdKey}
            entity={entity as EntityInfoStats}
            category={entity.category}
            active={true}
            onClick={() => {
              const item = itemsMap.get(entity.entityDataIdKey);
              if (item) handleClick(item);
            }}
            hideCount
            hideMarked
          />
        ))}
      </div>
    </EntityGroup>
  );
});

export default ReadFileEntityGroup;
