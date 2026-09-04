import type { DataInstance } from '@endfieldmap/map-core';
import type { CollectionIdItem, InvestigateData } from '@endfieldmap/map-service/@types/note';
import { cn } from '@endfieldmap/tools';
import {
  CheckboxToggle,
  FilterMarked,
  FilterUnMarked,
  ScrollArea,
  useIsMobile,
  ZmdRoundIconButton,
} from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/common/input';
import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';
import uiManager from '@/services/ui_manager';

// ---------- 数据模型 ----------

interface NoteItem {
  id: string;
  levelLogicId: number | null;
  canJump: boolean;
  title: string;
  icon?: string;
}

interface CategoryGroup {
  name: string;
  displayName: string;
  items: NoteItem[];
}

interface CollectionEntry {
  key: string;
  mapId: string;
  name: string;
  displayName: string;
  desc: string;
  displayDesc: string;
  categories: CategoryGroup[];
  /** 全量条目数 */
  total: number;
  /** 可定位条目的 levelLogicId（统一标记功能只针对地图实体） */
  jumpableIds: number[];
  /** 搜索命中的条目数（未搜索时等于 total） */
  matchCount: number;
}

interface NoteMatch {
  noteId: string;
  collectionKey: string;
}

// ---------- 通用小组件 ----------

// 高亮文本组件
const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>;
  // 转义正则特殊字符
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="text-[#3e7bd4]">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

const ChevronUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path
      d="M4.5 10L8 6.5L11.5 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path
      d="M4.5 6L8 9.5L11.5 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 定位十字准星
const CrosshairIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className}>
    <circle cx="8" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M8 1v3M8 12v3M1 8h3M12 8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="8" cy="8" r="1" fill="currentColor" />
  </svg>
);

// 图标加载失败时按图标族兜底为字形
const fallbackKindOf = (icon?: string): 'book' | 'screen' | 'bag' | 'doc' => {
  if (!icon) return 'doc';
  if (/notebook|oldbook/.test(icon)) return 'book';
  if (/pad|screen|appliance/.test(icon)) return 'screen';
  if (/bag/.test(icon)) return 'bag';
  return 'doc';
};

const FallbackGlyph = ({ kind }: { kind: 'book' | 'screen' | 'bag' | 'doc' }) => {
  const common = {
    stroke: 'currentColor',
    strokeWidth: 1.3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <svg viewBox="0 0 16 16" className="w-full h-full text-current">
      {kind === 'book' && (
        <g {...common}>
          <path d="M2.5 3.5h4a2 2 0 0 1 1.5.8 2 2 0 0 1 1.5-.8h4v9h-4a2 2 0 0 0-1.5.7 2 2 0 0 0-1.5-.7h-4z" />
          <path d="M8 4.3v8.9" />
        </g>
      )}
      {kind === 'screen' && (
        <g {...common}>
          <rect x="2.5" y="3" width="11" height="8" />
          <path d="M6 13.5h4M8 11v2.5" />
        </g>
      )}
      {kind === 'bag' && (
        <g {...common}>
          <path d="M3.5 5.5h9l-.8 7h-7.4z" />
          <path d="M6 5.5V4a2 2 0 0 1 4 0v1.5" />
        </g>
      )}
      {kind === 'doc' && (
        <g {...common}>
          <path d="M4 2.5h5.5L12 5v8.5H4z" />
          <path d="M9.5 2.5V5H12" />
          <path d="M6 8h4M6 10h4" />
        </g>
      )}
    </svg>
  );
};

const NoteIcon = ({ icon }: { icon?: string }) => {
  const [failed, setFailed] = useState(false);
  const url = icon ? `${service.assetService.url.entityImage}/${icon}.png` : '';

  if (!url || failed) {
    return (
      <span className="w-full h-full flex items-center justify-center text-[#8a8a8a]">
        <FallbackGlyph kind={fallbackKindOf(icon)} />
      </span>
    );
  }
  return (
    <img src={url} alt="" draggable={false} className="w-full h-full object-contain" onError={() => setFailed(true)} />
  );
};

// ---------- 紧凑条目卡片 ----------

const NoteCard = ({
  note,
  index,
  entity,
  searchQuery = '',
  isFocused = false,
  onJump,
  onToggleMark,
}: {
  note: NoteItem;
  index: number;
  entity?: DataInstance;
  searchQuery?: string;
  isFocused?: boolean;
  onJump?: () => void;
  onToggleMark?: (entity: DataInstance) => void;
}) => {
  const marked = !!entity?.marked;
  const markable = note.canJump && !!entity?.markable;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (note.canJump) {
      service.dataService.mapDataService.moveToEntity(note.levelLogicId as number, true, true, void 0, 5);
      onJump?.();
    }
  };

  const handleMarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (entity) onToggleMark?.(entity);
  };

  return (
    <motion.div
      data-note-id={note.id}
      onClick={note.canJump ? handleClick : undefined}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.3), ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        'group/card relative flex items-center gap-2.5 h-10 pl-2 pr-1.5 select-none overflow-hidden transition-colors duration-200',
        note.canJump ? 'cursor-pointer' : 'cursor-not-allowed opacity-55 saturate-50',
        isFocused
          ? 'bg-[#e2ecfc]'
          : marked
            ? 'bg-[#faf3d8]'
            : note.canJump
              ? 'bg-[#f6f5f3] hover:bg-[#edecea]'
              : 'bg-[#f1f0ed]'
      )}
    >
      {/* 图标 */}
      <div className="shrink-0 w-7 h-7 bg-white/80 grid place-items-center overflow-hidden">
        <div className="w-5 h-5">
          <NoteIcon icon={note.icon} />
        </div>
      </div>

      {/* 名称 */}
      <span
        className={cn(
          'flex-1 min-w-0 text-[13px] font-semibold leading-tight truncate transition-colors',
          note.canJump ? 'text-[#2a2a2a] group-hover/card:text-black' : 'text-[#777]'
        )}
      >
        <HighlightText text={note.title} highlight={searchQuery} />
      </span>

      {/* 定位按钮（可定位条目 hover 出现） */}
      {note.canJump && (
        <div
          className="shrink-0 w-7 h-7 grid place-items-center text-[#009e6c] opacity-0 group-hover/card:opacity-100 transition-all duration-200 group-hover/card:bg-[#00ffa2]/15"
          title={`LOC ${note.levelLogicId}`}
        >
          <CrosshairIcon className="w-4 h-4" />
        </div>
      )}

      {/* 无定位标注 */}
      {!note.canJump && (
        <span
          className="shrink-0 inline-flex items-center px-1.5 h-5 bg-black/5 text-[10px] text-black/40 select-none"
          title="该条目不在地图上"
        >
          {/* TODO: i18n */}
          无定位
        </span>
      )}

      {/* 收集标记：走项目统一的实体标记（仅地图实体可标记） */}
      {markable && (
        <span
          role="button"
          tabIndex={0}
          onClick={handleMarkClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleMarkClick(e as unknown as React.MouseEvent);
            }
          }}
          className={cn(
            'shrink-0 w-6 h-6 grid place-items-center text-lg leading-none transition-opacity duration-150',
            marked ? 'text-[#fffa00] opacity-100' : 'opacity-30 group-hover/card:opacity-80 hover:opacity-100!'
          )}
          title={marked ? '取消标记' : '标记为已收集'}
        >
          {marked ? <FilterMarked /> : <FilterUnMarked />}
        </span>
      )}
    </motion.div>
  );
};

// ---------- 左侧专题索引 ----------

const SidebarCollectionItem = ({
  entry,
  markedCount,
  active,
  searching,
  onSelect,
  onToggleAllMarked,
}: {
  entry: CollectionEntry;
  markedCount: number;
  active: boolean;
  searching: boolean;
  onSelect: () => void;
  onToggleAllMarked: () => void;
}) => {
  const dimmed = searching && entry.matchCount === 0;
  const markableTotal = entry.jumpableIds.length;
  const allMarked = markableTotal > 0 && markedCount >= markableTotal;
  return (
    <button
      onClick={onSelect}
      className={cn(
        'group/row relative w-full flex items-center gap-2 h-8 pl-4 pr-2 text-left transition-colors duration-150',
        active ? 'bg-white/12 text-white' : 'text-white/55 hover:text-white/90 hover:bg-white/4',
        dimmed && !active && 'opacity-35'
      )}
    >
      {active && (
        <motion.div layoutId="collections-sidebar-active" className="absolute left-0 top-0 bottom-0 w-1 bg-[#ffff21]" />
      )}
      <span className="flex-1 truncate text-xs font-medium">{entry.displayName}</span>

      {/* 一键标记：hover 出现；已全标记时常显 */}
      {markableTotal > 0 && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onToggleAllMarked();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onToggleAllMarked();
            }
          }}
          className={cn(
            'shrink-0 w-4 h-4 grid place-items-center text-base leading-none transition-colors',
            allMarked ? 'text-[#fffa00]' : 'text-white/60 opacity-0 group-hover/row:opacity-60 hover:opacity-100!'
          )}
          title={allMarked ? '取消全部标记' : '标记全部为已收集'}
        >
          {allMarked ? <FilterMarked /> : <FilterUnMarked />}
        </span>
      )}

      {/* 计数：非搜索态展示收集进度 已标记/可标记；搜索态展示 匹配/总数 */}
      <span className="shrink-0 text-[10px] font-[Outfit] tabular-nums tracking-wide">
        {searching ? (
          <span className={active ? 'text-[#ffff21]' : 'text-white/35'}>
            {entry.matchCount}/{entry.total}
          </span>
        ) : (
          <>
            <span className={markedCount > 0 ? (active ? 'text-[#ffff21]' : 'text-[#d9c94a]') : 'text-white/35'}>
              {markedCount}
            </span>
            <span className="text-white/35">/{markableTotal}</span>
          </>
        )}
      </span>
    </button>
  );
};

// ---------- 主组件 ----------

const Note = observer(({ onClose }: { onClose?: () => void }) => {
  const { t } = useTranslation(['lang', 'sidebar']);
  const isMobile = useIsMobile();
  const { adapter } = useAdapter();
  const data = service.dataService.noteDataService.investigateData;
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [pendingScrollNoteId, setPendingScrollNoteId] = useState<string | null>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);

  const closeOnJump = uiManager.noteCloseOnJump.value;

  // 统一标记：与地图标点标记共用 entityDataService，状态落在 DataInstance.marked
  const findEntity = useCallback(
    (levelLogicId: number | null): DataInstance | undefined => {
      if (!levelLogicId) return undefined;
      return adapter?.entityRegistry.searchById(adapter.mapController.dataManager.mapIds, levelLogicId);
    },
    [adapter]
  );

  const handleToggleEntityMark = useCallback((entity: DataInstance) => {
    service.dataService.mapDataService.entityDataService.markEntity(entity.mapId, entity.id, !entity.marked);
  }, []);

  const handleJump = useCallback(() => {
    if (closeOnJump) onClose?.();
  }, [closeOnJump, onClose]);

  // 地图 ID -> 展示名
  const mapNameById = useMemo(() => {
    const map = new Map<string, string>();
    service.dataService.mapDataService.mapData?.data?.forEach((d) => {
      map.set(d.id, t(`lang:${d.name}`, { defaultValue: d.name }));
    });
    return map;
  }, [t]);

  // 数据加工 + 搜索过滤（匹配范围：条目名/条目ID/levelLogicId/专题名/专题描述/分类名）
  const { entries, regionOrder, matchIds } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list: CollectionEntry[] = [];
    const matches: NoteMatch[] = [];

    const match = (raw: string | number | null | undefined, translated: string) => {
      if (!query) return true;
      return translated.toLowerCase().includes(query) || (raw != null && String(raw).toLowerCase().includes(query));
    };

    (data as InvestigateData[] | undefined)?.forEach((region) => {
      region.collections.forEach((collection) => {
        const collectionName = t(`lang:${collection.name}`, { defaultValue: collection.name });
        const collectionDesc = t(`lang:${collection.desc}`, { defaultValue: collection.desc || '' });

        let total = 0;
        let matchCount = 0;
        const categories: CategoryGroup[] = [];
        const jumpableIds: number[] = [];

        collection.categories.forEach((category) => {
          const categoryName = t(`lang:${category.name}`, { defaultValue: category.name });
          const items: NoteItem[] = [];

          (category.collectionIdList ?? []).forEach((raw: CollectionIdItem) => {
            const canJump = !!raw.levelLogicId;
            const note: NoteItem = {
              id: raw.id,
              levelLogicId: raw.levelLogicId ?? null,
              canJump,
              title: t(`lang:${raw.name}`, { defaultValue: raw.name }),
              icon: raw.icon,
            };
            total++;
            if (canJump) jumpableIds.push(raw.levelLogicId as number);

            const hit =
              !query ||
              match(raw.name, note.title) ||
              note.id.toLowerCase().includes(query) ||
              (note.levelLogicId != null && String(note.levelLogicId).includes(query)) ||
              match(collection.name, collectionName) ||
              match(collection.desc, collectionDesc) ||
              match(category.name, categoryName);

            if (hit) {
              items.push(note);
              matchCount++;
            }
          });

          if (items.length > 0) {
            categories.push({ name: category.name, displayName: categoryName, items });
          }
        });

        if (total === 0) return;

        const key = `${region.mapId}::${collection.id || collection.name}`;
        categories.forEach((cat) => {
          cat.items.forEach((item) => matches.push({ noteId: item.id, collectionKey: key }));
        });

        list.push({
          key,
          mapId: region.mapId,
          name: collection.name,
          displayName: collectionName,
          desc: collection.desc || '',
          displayDesc: collectionDesc,
          categories,
          total,
          jumpableIds,
          matchCount,
        });
      });
    });

    const order: string[] = [];
    list.forEach((e) => {
      if (!order.includes(e.mapId)) order.push(e.mapId);
    });

    return {
      entries: list,
      regionOrder: order,
      matchIds: matches,
    };
  }, [data, searchQuery, t]);

  // 各专题已标记数（渲染期直读 DataInstance.marked，observer 自动响应标记变化）
  const markedCountByKey = (() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      let n = 0;
      e.jumpableIds.forEach((id) => {
        if (findEntity(id)?.marked) n++;
      });
      map.set(e.key, n);
    });
    return map;
  })();

  // 默认选中第一个专题；搜索态下当前专题无匹配时跟随第一个有匹配的专题
  useEffect(() => {
    if (entries.length === 0) {
      setActiveKey(null);
      return;
    }
    const current = entries.find((e) => e.key === activeKey);
    if (!current) {
      setActiveKey(entries[0].key);
      return;
    }
    if (searchQuery.trim() && current.matchCount === 0) {
      const firstHit = entries.find((e) => e.matchCount > 0);
      if (firstHit) setActiveKey(firstHit.key);
    }
  }, [entries, activeKey, searchQuery]);

  // 搜索内容变化时重置当前匹配索引
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  const activeEntry = entries.find((e) => e.key === activeKey) ?? null;

  // 滚动到详情区指定卡片；跨专题切换时目标卡片要等换场后才渲染，用 rAF 轮询等待
  useEffect(() => {
    if (!pendingScrollNoteId) return;
    let raf = 0;
    let tries = 0;
    const tryScroll = () => {
      const el = detailScrollRef.current?.querySelector(`[data-note-id="${pendingScrollNoteId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setPendingScrollNoteId(null);
      } else if (tries++ < 30) {
        raf = requestAnimationFrame(tryScroll);
      }
    };
    tryScroll();
    return () => cancelAnimationFrame(raf);
  }, [pendingScrollNoteId, activeEntry]);

  const goToMatch = useCallback(
    (index: number) => {
      if (matchIds.length === 0) return;
      const target = matchIds[index];
      if (!target) return;
      setCurrentMatchIndex(index);
      if (target.collectionKey !== activeKey) setActiveKey(target.collectionKey);
      setPendingScrollNoteId(target.noteId);
    },
    [matchIds, activeKey]
  );

  const handlePrevMatch = useCallback(() => {
    if (matchIds.length === 0) return;
    goToMatch(currentMatchIndex <= 0 ? matchIds.length - 1 : currentMatchIndex - 1);
  }, [matchIds.length, currentMatchIndex, goToMatch]);

  const handleNextMatch = useCallback(() => {
    if (matchIds.length === 0) return;
    goToMatch(currentMatchIndex >= matchIds.length - 1 ? 0 : currentMatchIndex + 1);
  }, [matchIds.length, currentMatchIndex, goToMatch]);

  const hasSearchContent = searchQuery.trim().length > 0;

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && hasSearchContent) {
        e.preventDefault();
        if (e.shiftKey) {
          handlePrevMatch();
        } else {
          handleNextMatch();
        }
      }
    },
    [hasSearchContent, handlePrevMatch, handleNextMatch]
  );

  const focusedNoteId = hasSearchContent && matchIds.length > 0 ? matchIds[currentMatchIndex]?.noteId : null;

  const groupedEntries = useMemo(
    () =>
      regionOrder.map((mapId) => ({
        mapId,
        mapName: mapNameById.get(mapId) ?? mapId.toUpperCase(),
        entries: entries.filter((e) => e.mapId === mapId),
      })),
    [regionOrder, entries, mapNameById]
  );

  const renderDetail = (entry: CollectionEntry) => (
    <motion.div
      key={entry.key}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex flex-col gap-4 pb-8"
    >
      {/* 类目分组：轻量组头 + 双列紧凑卡片 */}
      {entry.categories.length > 0 ? (
        entry.categories.map((category) => (
          <section key={category.name} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-[#363636] tracking-wide truncate">
                <HighlightText text={category.displayName} highlight={searchQuery} />
              </h4>
              <div className="flex-1 border-t border-dashed border-black/15" />
              <span className="shrink-0 text-[10px] font-[Outfit] tabular-nums text-[#666] tracking-wider">
                {category.items.length}
              </span>
            </div>
            <div className={cn('grid gap-2', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
              {category.items.map((note, index) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  index={index}
                  entity={findEntity(note.levelLogicId)}
                  searchQuery={searchQuery}
                  isFocused={note.id === focusedNoteId}
                  onJump={handleJump}
                  onToggleMark={handleToggleEntityMark}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="py-12 flex flex-col items-center justify-center opacity-50">
          <span className="text-xs text-[#888] tracking-widest font-[Outfit]">NO MATCHING RECORDS FOUND</span>
        </div>
      )}
    </motion.div>
  );

  // 搜索框 + 匹配导航（桌面并入标题行，移动端独立一行）
  const searchControls = (
    <>
      <Input
        defaultValue={searchQuery}
        onValueChange={setSearchQuery}
        placeholder={t('sidebar:search', { defaultValue: '搜索' })}
        className={isMobile ? 'flex-1 min-w-0' : 'w-40 shrink-0'}
      />

      <AnimatePresence>
        {hasSearchContent && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex items-center overflow-clip shrink-0"
          >
            <div className="flex items-center gap-1 pr-1">
              <span className="text-[10px] text-[#999] font-[Outfit] whitespace-nowrap tabular-nums select-none">
                {matchIds.length > 0 ? `${currentMatchIndex + 1}/${matchIds.length}` : '0/0'}
              </span>
              <ZmdRoundIconButton
                onClick={handlePrevMatch}
                disabled={matchIds.length === 0}
                className="w-6 h-6 shadow-sm"
              >
                <ChevronUpIcon />
              </ZmdRoundIconButton>
              <ZmdRoundIconButton
                onClick={handleNextMatch}
                disabled={matchIds.length === 0}
                className="w-6 h-6 shadow-sm"
              >
                <ChevronDownIcon />
              </ZmdRoundIconButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CheckboxToggle
        checked={closeOnJump}
        className={cn(
          'self-center shrink-0 pl-1.5 py-1 pr-2 rounded-full shadow-[0_0_3px_rgba(0,0,0,0.1)]',
          closeOnJump ? 'bg-[#484848]' : 'bg-[#E8E6E6]'
        )}
        onToggle={() => (uiManager.noteCloseOnJump.value = !uiManager.noteCloseOnJump.value)}
        // TODO: i18n
        label="跳转时关闭"
        size="sm"
        hideBorder
      />
    </>
  );

  return (
    <div className="flex h-full w-full overflow-hidden flex-col md:flex-row">
      {/* ===== 左侧：专题索引 ===== */}
      <aside
        className={cn(
          'shrink-0 bg-[#363636] flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-black/40',
          isMobile ? 'h-11 flex-row items-stretch' : 'w-52'
        )}
      >
        {/* 索引列表 */}
        {isMobile ? (
          <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide">
            {entries.map((entry) => (
              <button
                key={entry.key}
                onClick={() => setActiveKey(entry.key)}
                className={cn(
                  'relative shrink-0 h-full px-3 text-xs whitespace-nowrap transition-colors',
                  entry.key === activeKey ? 'text-white' : 'text-white/50 hover:text-white/80'
                )}
              >
                {entry.displayName}
                {entry.key === activeKey && (
                  <motion.div
                    layoutId="collections-sidebar-active"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#ffff21]"
                  />
                )}
              </button>
            ))}
          </div>
        ) : (
          <ScrollArea scrollY scrollX={false} contentClassName="py-2">
            <nav className="flex flex-col gap-3">
              {groupedEntries.map((group) => (
                <div key={group.mapId} className="flex flex-col">
                  <div className="px-4 pt-2 pb-1">
                    <span className="text-[10px] text-white/35 truncate">{group.mapName}</span>
                  </div>
                  {group.entries.map((entry) => (
                    <SidebarCollectionItem
                      key={entry.key}
                      entry={entry}
                      markedCount={markedCountByKey.get(entry.key) ?? 0}
                      active={entry.key === activeKey}
                      searching={!!searchQuery.trim()}
                      onSelect={() => setActiveKey(entry.key)}
                      onToggleAllMarked={() => {
                        const markableTotal = entry.jumpableIds.length;
                        const markedCount = markedCountByKey.get(entry.key) ?? 0;
                        service.dataService.mapDataService.entityDataService.markEntities(
                          entry.mapId,
                          entry.jumpableIds,
                          markedCount < markableTotal
                        );
                      }}
                    />
                  ))}
                </div>
              ))}
            </nav>
          </ScrollArea>
        )}
      </aside>

      {/* ===== 右侧：专题详情 ===== */}
      <div className="flex-1 min-w-0 flex flex-col bg-white overflow-hidden">
        {/* 专题头（motion exit 卸载在本项目 React Compiler 下不可靠，这里只用挂载动画 + key 切换） */}
        {activeEntry && (
          <motion.header
            key={activeEntry.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="shrink-0 px-5 pt-4 pb-3"
          >
            {/* 标题行：桌面端并入搜索与跳转设置，节省一行 */}
            <div className="flex items-center gap-2.5" onKeyDown={handleSearchKeyDown}>
              <h3 className="flex-1 min-w-0 text-xl font-bold text-[#222] tracking-wide leading-tight truncate">
                <HighlightText text={activeEntry.displayName} highlight={searchQuery} />
              </h3>
              {!isMobile && searchControls}
            </div>

            {activeEntry.displayDesc && (
              <p className="text-[11px] text-[#888] leading-relaxed mt-1.5 line-clamp-2">
                <HighlightText text={activeEntry.displayDesc} highlight={searchQuery} />
              </p>
            )}
            <div className="h-px w-full bg-linear-to-r from-black/15 to-transparent mt-3" />
          </motion.header>
        )}

        {/* 移动端工具行 */}
        {isMobile && (
          <div className="shrink-0 px-5 pb-2.5 flex items-center gap-2.5" onKeyDown={handleSearchKeyDown}>
            {searchControls}
          </div>
        )}

        {/* 详情滚动区 */}
        <div ref={detailScrollRef} className="flex-1 min-h-0 relative">
          <ScrollArea className="h-full w-full" scrollY scrollX={false} contentClassName="px-5">
            {activeEntry ? (
              renderDetail(activeEntry)
            ) : (
              <div className="py-16 flex flex-col items-center justify-center opacity-50">
                <span className="text-xs text-[#888] tracking-widest font-[Outfit]">NO DATA</span>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
});

export default Note;
