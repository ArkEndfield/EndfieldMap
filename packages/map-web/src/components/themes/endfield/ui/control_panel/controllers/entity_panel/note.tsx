import type { EntityInfoStats } from '@endfieldmap/map-core';
import { NoteKey } from '@endfieldmap/map-core';
import { useTranslation } from 'react-i18next';
import EntityGroup from '@themes/endfield/ui/control_panel/controllers/entity_panel/group';
import EntityItem from '@themes/endfield/ui/control_panel/controllers/entity_panel/item';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import type { NoteItem } from '@/@types/note';
import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';

/**
 * 情报档案组件
 * 默认隐藏，仅在特定搜索条件时显示
 */
const NoteEntityGroup: React.FC<{ searchQuery: string }> = observer(({ searchQuery }) => {
  const { t } = useTranslation(['sidebar', 'lang']);
  const { adapter } = useAdapter();
  const data = service.dataService.noteDataService.investigateData;

  // 处理数据：建立 collectionId 到 name 的映射，并准备搜索结果
  const itemsResult = useMemo((): { itemsMap: Map<string, NoteItem>; itemsList: NoteItem[] } => {
    if (!data) {
      return { itemsMap: new Map<string, NoteItem>(), itemsList: [] };
    }

    const map = new Map<string, NoteItem>();
    const list: NoteItem[] = [];

    // 遍历 domain_1 和 domain_2
    const domains = [...(data.domain_1 ?? []), ...(data.domain_2 ?? [])];

    domains.forEach((item) => {
      const { name, desc, categories } = item;

      // 遍历 categories 下的 collectionIdList，建立 id 到 name 的映射
      categories.forEach((category) => {
        const { collectionIdList } = category;
        collectionIdList.forEach(({ id, levelLogicId }) => {
          // 使用 lang 命名空间进行翻译
          const translatedName = t(`lang:${name}`, { defaultValue: name });
          const NoteItem: NoteItem = {
            id,
            levelLogicId,
            name,
            icon: 'item_read_file',
            translatedName,
            value: desc || '',
          };
          map.set(id, NoteItem);
          list.push(NoteItem);
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
      (item: NoteItem) =>
        item.value.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.translatedName.toLowerCase().includes(query)
    );
  }, [searchQuery, itemsList]);

  // 点击处理
  const handleClick = (item: NoteItem) => {
    const id = item.levelLogicId;
    if (id) {
      adapter.moveToEntity(id, true, true, void 0, 5);
    }
  };

  // 检查是否满足显示条件
  const shouldShow = searchQuery.trim() === '799' || (searchQuery.trim() !== '' && filteredItems.length > 0);

  if (!shouldShow) {
    return null;
  }

  // 转换为兼容 EntityItem 的格式
  const entityItems: EntityInfoStats[] = filteredItems.map((item: NoteItem) => ({
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
    <EntityGroup title={t('filter.category.#note')} subtitle="READ FILE" iconColor="#ff6b6b">
      <div className="grid grid-cols-2 gap-x-1 gap-y-1.5 py-2">
        {entityItems.map((entity) => {
          const item = itemsMap.get(entity.uniqueKey);
          return (
            <EntityItem
              key={entity.entityDataIdKey}
              entity={entity}
              category={entity.category}
              active={!!item?.levelLogicId}
              onClick={() => {
                if (item) handleClick(item);
              }}
              hideCount
              hideMarked
            />
          );
        })}
      </div>
    </EntityGroup>
  );
});

export default NoteEntityGroup;
