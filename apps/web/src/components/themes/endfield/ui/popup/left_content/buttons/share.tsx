import type { DataInstance } from '@endfieldmap/map-core';
import { CustomPointKey, ElectricPoleKey, NoteKey } from '@endfieldmap/map-core';
import { cn } from '@endfieldmap/tools';
import {
  ButtonWithAudio,
  DecoTriTriangle,
  ScrollArea,
  ShareIcon,
  Tooltip,
  ZmdSquareButton,
} from '@endfieldmap/web-components';
import { Search } from '@themes/endfield/ui/control_panel/controllers/entity_panel/search';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import type {
  CategoryGroupData,
  CategoryItem,
} from '@/components/themes/endfield/ui/popup/left_content/buttons/share_category';
import { CategoryGroup } from '@/components/themes/endfield/ui/popup/left_content/buttons/share_category';
import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';
import { buildShareLink, copyShareLink } from '@/services/share_link';

// 分类排序与左侧实体面板保持一致
const CATEGORY_ORDER = [
  'disposable',
  'trchest',
  'rare_gather',
  'common_gather',
  'system',
  'enemy',
  'dnarrative',
  'narrative',
];

export interface ShareButtonProps {
  entity: DataInstance;
}

export const ShareButton: React.FC<ShareButtonProps> = observer(({ entity }) => {
  const { t } = useTranslation(['common', 'sidebar', 'lang']);
  const { adapter } = useAdapter();
  const [showPopover, setShowPopover] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const currentCategory = entity.entityInfo?.category;

  const resolveEntityName = useCallback(
    (entityDataIdKey: string, category: string) => {
      if (category === ElectricPoleKey) {
        return t(`sidebar:operation.electric_pole.create.device_type.options.${entityDataIdKey}`, {
          defaultValue: entityDataIdKey,
        });
      }
      if (category === CustomPointKey) {
        return t(`common:custom_point.type.${entityDataIdKey}`, { defaultValue: entityDataIdKey });
      }
      if (category === NoteKey) {
        return t(`lang:${entityDataIdKey}`, { defaultValue: entityDataIdKey });
      }
      return t(`lang:${service.langHashService.getHash(entityDataIdKey)}`, { defaultValue: entityDataIdKey });
    },
    [t]
  );

  const allItems: CategoryItem[] = adapter.entityController.currentStats
    .filter((s) => s.mapId === entity.mapId)
    .map((s) => ({
      entityDataIdKey: s.entityDataIdKey,
      category: s.category,
      name: resolveEntityName(s.entityDataIdKey, s.category),
      pic: s.entityInfo?.pic || '',
    }));

  // 按分类分组，当前标点所属分类排在最前，其余按左侧面板顺序
  const groupMap = new Map<string, CategoryItem[]>();
  allItems.forEach((item) => {
    if (!groupMap.has(item.category)) groupMap.set(item.category, []);
    groupMap.get(item.category)!.push(item);
  });
  const groups: CategoryGroupData[] = Array.from(groupMap.entries()).map(([category, items]) => ({
    category,
    name: t(`sidebar:filter.category.${category}`, { defaultValue: category }),
    items,
  }));
  groups.sort((a, b) => {
    if (a.category === currentCategory) return -1;
    if (b.category === currentCategory) return 1;
    const ai = CATEGORY_ORDER.indexOf(a.category);
    const bi = CATEGORY_ORDER.indexOf(b.category);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const hasMore = groups.some((g) => g.category !== currentCategory);

  useEffect(() => {
    if (!showPopover) return;
    // 默认：仅勾选当前标点所属的具体小类，其余折叠
    setCheckedKeys(new Set([entity.entityDataIdKey]));
    setShowMore(false);
    setSearchQuery('');
    setOpenCategories(new Set(currentCategory ? [currentCategory] : []));

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverPos({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
    }
  }, [showPopover]);

  const handleToggleItem = useCallback((key: string) => {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback((keys: string[], checked: boolean) => {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => (checked ? next.add(k) : next.delete(k)));
      return next;
    });
  }, []);

  const handleToggleOpen = useCallback((category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const handleCopy = useCallback(async () => {
    const link = buildShareLink(entity.mapId, entity.id, Array.from(checkedKeys));
    await copyShareLink(link, t);
    setShowPopover(false);
  }, [entity.mapId, entity.id, checkedKeys, t]);

  useEffect(() => {
    if (!showPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowPopover(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside, true);
    return () => window.removeEventListener('mousedown', handleClickOutside, true);
  }, [showPopover]);

  const query = searchQuery.trim().toLowerCase();
  // 未展开时只显示当前分类；展开后显示全部并支持搜索过滤
  const visibleGroups = (showMore ? groups : groups.filter((g) => g.category === currentCategory))
    .map((g) => (query ? { ...g, items: g.items.filter((i) => i.name.toLowerCase().includes(query)) } : g))
    .filter((g) => g.items.length > 0);

  return (
    <div className="relative" ref={buttonRef}>
      <Tooltip
        tooltip={t('common:share_link.copy_link')}
        as={ButtonWithAudio}
        placement="bottom"
        asProps={{
          className: cn('text-xl p-1', showPopover && 'text-[#fcee21]'),
          onClick: () => setShowPopover((v) => !v),
        }}
      >
        <ShareIcon />
      </Tooltip>

      {createPortal(
        <AnimatePresence>
          {showPopover && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.25 }}
              style={{ left: popoverPos.x, top: popoverPos.y }}
              className={cn(
                'fixed z-[9999] -translate-x-1/2 flex flex-col',
                'w-72 text-white',
                'bg-[#1b1b1b] backdrop-blur-sm',
                'border border-[#383938] shadow-[0_8px_32px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.3)]',
                'ring-1 ring-white/10'
              )}
            >
              <div className="shrink-0 px-3 py-2 text-xs text-white/50 border-b border-[#383938]">
                {t('common:share_link.select_categories')}
              </div>

              {showMore && (
                <div className="shrink-0 px-1 pt-2 pb-1.5 border-b border-[#383938]">
                  <Search
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    placeholder={t('common:search_placeholder')}
                  />
                </div>
              )}

              <div className="min-h-0">
                <ScrollArea className="h-auto max-h-72" scrollbarX="hidden" scrollX={false}>
                  <div className="py-1">
                    {visibleGroups.map((group) => (
                      <CategoryGroup
                        key={group.category}
                        group={group}
                        checkedKeys={checkedKeys}
                        open={openCategories.has(group.category) || !!query}
                        onToggleOpen={() => handleToggleOpen(group.category)}
                        onToggleItem={handleToggleItem}
                        onToggleAll={handleToggleAll}
                      />
                    ))}

                    {!showMore && hasMore && (
                      <ButtonWithAudio
                        onClick={() => setShowMore(true)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 w-full px-2 py-2 mt-1',
                          'text-xs text-white/55 hover:text-[#fcee21] transition-colors',
                          'border-t border-[#383938]'
                        )}
                      >
                        <DecoTriTriangle className="text-[0.6rem]" />
                        {t('common:share_link.select_more')}
                      </ButtonWithAudio>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="shrink-0 border-t border-[#383938] p-2">
                <ZmdSquareButton type="primary" className="w-full" icon={<ShareIcon />} onClick={handleCopy}>
                  {t('common:share_link.confirm_copy')}
                </ZmdSquareButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
});
