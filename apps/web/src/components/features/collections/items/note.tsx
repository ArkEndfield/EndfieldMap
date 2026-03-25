import { ScrollArea, CheckboxToggle, ZmdRoundIconButton } from '@endfieldmap/web-components';
import { AnimatePresence, motion } from 'motion/react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { service } from '@/services';
import { Input } from '@/components/common/input';
import uiManager from '@/services/ui_manager';
import { cn } from '@endfieldmap/tools';
import type { CollectionIdItem } from '@endfieldmap/map-service/@types/note';

interface NoteItem {
  id: string;
  levelLogicId: number;
  title: string;
  summary: string;
  footerText: string;
  tags: string[];
  accentColor: string;
  canJump: boolean;
}

const Deco = ({ note }: { note: NoteItem }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect
      x="0.5"
      y="0.5"
      width="11"
      height="11"
      stroke={note.accentColor}
      strokeWidth="1"
      opacity="0.5"
      className={note.canJump ? 'group-hover:stroke-white transition-colors' : ''}
    />
    <line
      x1="6"
      y1="3"
      x2="6"
      y2="9"
      stroke={note.accentColor}
      strokeWidth="1"
      opacity="0.5"
      className={note.canJump ? 'group-hover:stroke-white transition-colors' : ''}
    />
    <line
      x1="3"
      y1="6"
      x2="9"
      y2="6"
      stroke={note.accentColor}
      strokeWidth="1"
      opacity="0.5"
      className={note.canJump ? 'group-hover:stroke-white transition-colors' : ''}
    />
  </svg>
);

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
          <mark key={i} className="bg-[#fffa00] text-black rounded-sm px-0.5 font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

// 搜索导航按钮图标
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

const NoteCard = ({
  note,
  index,
  searchQuery = '',
  isFocused = false,
  onJump,
}: {
  note: NoteItem;
  index: number;
  searchQuery?: string;
  isFocused?: boolean;
  onJump?: () => void;
}) => {
  const handleClick = () => {
    if (note.canJump) {
      service.dataService.mapDataService.moveToEntity(note.levelLogicId, true, true, void 0, 5);
      onJump?.();
    }
  };

  return (
    <motion.div
      data-note-id={note.id}
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className={cn(
        'group relative bg-[#363636] overflow-hidden transition-all duration-300',
        note.canJump && 'hover:shadow-lg hover:shadow-black/20',
        isFocused && 'shadow-[0_0_16px_rgba(255,250,0,0.4),0_0_4px_rgba(255,250,0,0.3)]'
      )}
    >
      {/* 顶部装饰条 */}
      <div
        className={cn('h-0.5 w-full transition-colors duration-300', note.canJump ? 'group-hover:bg-white' : '')}
        style={{ background: isFocused ? '#fffa00' : note.accentColor }}
      />

      {/* 角落装饰 */}
      <div
        className={cn(
          'absolute top-2.5 right-2 opacity-0 transition-opacity duration-300',
          note.canJump ? 'group-hover:opacity-100' : ''
        )}
      >
        <Deco note={note} />
      </div>

      <div className="p-3.5 flex flex-col gap-2.5 h-full">
        {/* 数据ID */}
        <span className="text-[9px] text-white/10 tracking-wider select-none font-[Outfit] break-all">
          LOG://NOTE.
          <HighlightText text={note.id.toUpperCase()} highlight={searchQuery} />
        </span>

        {/* 标题 */}
        <h3
          className={cn(
            'text-sm font-bold text-[#e8e6e3] leading-snug tracking-wide transition-colors',
            note.canJump ? 'group-hover:text-white' : ''
          )}
        >
          <HighlightText text={note.title} highlight={searchQuery} />
        </h3>

        {/* 摘要 */}
        <p
          className={cn(
            'text-xs text-[#999] leading-relaxed line-clamp-3 transition-colors flex-1',
            note.canJump ? 'group-hover:text-[#ccc]' : ''
          )}
        >
          <HighlightText text={note.summary} highlight={searchQuery} />
        </p>

        {/* 底部：标签 + 尾部文本 */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'inline-flex items-center px-1.5 py-0.5 text-[10px] border transition-colors',
                  note.canJump ? 'group-hover:border-white/30 group-hover:text-white' : ''
                )}
                style={{
                  color: note.accentColor,
                  borderColor: `${note.accentColor}30`,
                  backgroundColor: `${note.accentColor}08`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <span
            className={cn(
              'text-[10px] text-[#666] shrink-0 ml-2 font-[Outfit] transition-colors',
              note.canJump ? 'group-hover:text-[#999]' : ''
            )}
          >
            <HighlightText text={note.footerText} highlight={searchQuery} />
          </span>
        </div>
      </div>

      {/* 右下角装饰 */}
      <div
        className={cn(
          'absolute bottom-0 right-0 w-4 h-4 border-b border-r opacity-0 transition-opacity duration-300',
          note.canJump ? 'group-hover:opacity-100 group-hover:border-white/50' : ''
        )}
        style={{ borderColor: `${note.accentColor}30` }}
      />
    </motion.div>
  );
};

const Note = observer(({ onClose }: { onClose?: () => void }) => {
  const { t } = useTranslation(['lang', 'sidebar']);
  const data = service.dataService.noteDataService.investigateData;
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const closeOnJump = uiManager.noteCloseOnJump.value;

  const handleJump = () => {
    if (closeOnJump) {
      onClose?.();
    }
  };

  const {
    data: structuredData,
    totalCount,
    matchIds,
  } = useMemo(() => {
    if (!data) return { data: [], totalCount: 0, matchIds: [] as string[] };

    let count = 0;
    const ids: string[] = [];
    const query = searchQuery.trim().toLowerCase();

    const processNotes = (
      collectionList: CollectionIdItem[],
      collectionName: string,
      collectionDesc: string,
      categoryName: string
    ) => {
      const list: NoteItem[] = [];
      const csName = t(`lang:${collectionName}`, { defaultValue: collectionName }).toLowerCase();
      const csDesc = t(`lang:${collectionDesc}`, { defaultValue: collectionDesc || '' }).toLowerCase();
      const cName = t(`lang:${categoryName}`, { defaultValue: categoryName }).toLowerCase();

      collectionList.forEach(({ id, levelLogicId, name, desc }) => {
        const canJump = !!levelLogicId;
        // TODO: i18n
        const tags = canJump ? ['地图收集'] : ['其他'];
        const color = canJump ? '#00ffa2' : '#ff6b35';
        const footerText = canJump ? `LOC_ID: ${levelLogicId}` : `SYS_ID: ${id.split('_').pop()}`;

        const note = {
          id,
          levelLogicId,
          canJump,
          title: name,
          summary: desc,
          footerText,
          tags,
          accentColor: color,
        };

        if (
          !query ||
          note.id.toLowerCase().includes(query) ||
          (note.levelLogicId && String(note.levelLogicId).includes(query)) ||
          csName.includes(query) ||
          csDesc.includes(query) ||
          cName.includes(query)
        ) {
          list.push(note);
          ids.push(note.id);
          count++;
        }
      });
      return list.sort((a, b) => (a.canJump === b.canJump ? 0 : a.canJump ? -1 : 1));
    };

    const filteredRegions = data
      .map((region) => {
        const filteredCollections = region.collections
          .map((collection) => {
            const filteredCategories = collection.categories
              .map((category) => ({
                ...category,
                notes: processNotes(
                  category.collectionIdList ?? [],
                  collection.name,
                  collection.desc || '',
                  category.name
                ),
              }))
              .filter((cat) => cat.notes.length > 0);

            return {
              ...collection,
              categories: filteredCategories,
            };
          })
          .filter((dom) => dom.categories.length > 0);

        return {
          ...region,
          collections: filteredCollections,
        };
      })
      .filter((reg) => reg.collections.length > 0);

    return { data: filteredRegions, totalCount: count, matchIds: ids };
  }, [data, searchQuery, t]);

  // 搜索内容变化时重置当前匹配索引
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  // 滚动到当前匹配的卡片
  const scrollToMatch = useCallback(
    (index: number) => {
      if (matchIds.length === 0) return;
      const targetId = matchIds[index];
      if (!targetId) return;

      const container = scrollContainerRef.current;
      if (!container) return;

      const cardEl = container.querySelector(`[data-note-id="${targetId}"]`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [matchIds]
  );

  const handlePrevMatch = useCallback(() => {
    if (matchIds.length === 0) return;
    const nextIndex = currentMatchIndex <= 0 ? matchIds.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(nextIndex);
  }, [matchIds.length, currentMatchIndex, scrollToMatch]);

  const handleNextMatch = useCallback(() => {
    if (matchIds.length === 0) return;
    const nextIndex = currentMatchIndex >= matchIds.length - 1 ? 0 : currentMatchIndex + 1;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(nextIndex);
  }, [matchIds.length, currentMatchIndex, scrollToMatch]);

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

  const focusedNoteId = hasSearchContent && matchIds.length > 0 ? matchIds[currentMatchIndex] : null;

  return (
    <ScrollArea className="w-full h-full" scrollY scrollX={false} scrollbarY="auto">
      <div ref={scrollContainerRef} className="p-5 flex flex-col gap-2">
        {/* 头部 */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[#363636]/20 tracking-wider select-none font-[Outfit]">
              SYS://COLLECTION.NOTES
            </span>

            {/* TODO: i18n */}
            <h2 className="text-base font-bold text-[#363636] tracking-wide">情报采集</h2>
            <p className="text-xs text-[#888]">情报档案库/情报采集</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#999] font-[Outfit]">{totalCount} ENTRIES</span>
            <div className="w-1.5 h-1.5 bg-[#00ffa2]" />
          </div>
        </div>

        {/* 搜索框 */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div className="sticky top-0 z-2 pt-2 flex items-center gap-3" onKeyDown={handleSearchKeyDown}>
          <Input
            defaultValue={searchQuery}
            onValueChange={setSearchQuery}
            placeholder={t('sidebar:search', { defaultValue: '搜索' })}
            className="flex-1"
          />

          {/* 搜索导航：上一个 / 下一个 */}
          <AnimatePresence>
            {hasSearchContent && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex items-center overflow-clip shrink-0"
              >
                <div className="flex items-center gap-1 py-1 pr-1">
                  {/* 匹配计数 */}
                  <span className="text-[10px] text-[#999] font-[Outfit] whitespace-nowrap tabular-nums select-none">
                    {matchIds.length > 0 ? `${currentMatchIndex + 1}/${matchIds.length}` : '0/0'}
                  </span>

                  {/* 上一个 */}
                  <ZmdRoundIconButton
                    onClick={handlePrevMatch}
                    disabled={matchIds.length === 0}
                    className="w-6 h-6 shadow-sm"
                  >
                    <ChevronUpIcon />
                  </ZmdRoundIconButton>

                  {/* 下一个 */}
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
              'pl-1.5 py-1 pr-2 rounded-full shadow-[0_0_3px_rgba(0,0,0,0.1)]',
              closeOnJump ? 'bg-[#484848]' : 'bg-[#E8E6E6]'
            )}
            onToggle={() => (uiManager.noteCloseOnJump.value = !uiManager.noteCloseOnJump.value)}
            // TODO: i18n
            label="跳转时关闭本页"
            size="sm"
            hideBorder
          />
        </div>

        {/* 分割线 */}
        <div className="h-px bg-[#363636]/10" />

        {/* 内容区域 */}
        <div className="flex flex-col gap-12 pb-10">
          {structuredData.length > 0 ? (
            structuredData.map((region) => (
              <div key={region.mapId} className="flex flex-col gap-10 mt-2">
                {region.collections.map((collection) => (
                  <div key={collection.id || collection.name} className="flex flex-col">
                    {/* 头部：大类与地图关联信息，高度还原设计图主标题风格 */}
                    <div className="flex flex-col mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-0.75 bg-[#222]" />
                        <span className="text-[10px] font-bold font-[Outfit] tracking-widest text-[#222]">
                          END//FIELD. {region.mapId.toUpperCase()}
                        </span>
                      </div>
                      <h2 className="text-[28px] font-bold text-[#222] tracking-wider relative -left-px">
                        <HighlightText
                          text={t(`lang:${collection.name}`, { defaultValue: collection.name })}
                          highlight={searchQuery}
                        />
                      </h2>
                      <div className="h-px w-full bg-linear-to-r from-black/20 to-transparent mt-3 mb-3" />
                      <p className="text-xs text-[#666] leading-relaxed max-w-3xl">
                        <HighlightText
                          text={t(`lang:${collection.desc}`, { defaultValue: collection.desc || 'No Description.' })}
                          highlight={searchQuery}
                        />
                      </p>
                    </div>

                    {/* 小类列表 */}
                    <div className="flex flex-col gap-6 pl-0">
                      {collection.categories.map((category) => (
                        <div
                          key={category.name}
                          className="flex flex-col border border-black/5 bg-[#fefefe]/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden"
                        >
                          {/* 装饰性背景网格 */}
                          <div
                            className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{
                              backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                              backgroundSize: '16px 16px',
                            }}
                          />

                          {/* 小类暗色标题条 (完全符合设计图左侧栏深色条风格) */}
                          <div className="flex items-center justify-between bg-[#404040] px-3 py-1.5 shadow-sm relative border-b border-white/5">
                            {/* 细微的对角线或杂色纹理 */}
                            <div
                              className="absolute inset-0 opacity-10 pointer-events-none"
                              style={{
                                backgroundImage:
                                  'repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 4px)',
                              }}
                            />

                            <div className="flex items-center gap-2 relative">
                              <div className="w-1.25 h-1.25 border border-white/70 box-content" />
                              <h4 className="text-[13px] font-bold text-[#efefef] tracking-widest relative -top-[0.5px]">
                                <HighlightText
                                  text={t(`lang:${category.name}`, { defaultValue: category.name })}
                                  highlight={searchQuery}
                                />
                              </h4>
                            </div>

                            <div className="flex items-center gap-1.5 bg-black/40 rounded-full px-2.5 py-0.5 backdrop-blur-sm relative">
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="text-white/60"
                              >
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              {/* TODO: i18n */}
                              <span className="text-[10px] text-white/90 font-[Outfit] tracking-wider relative top-[0.5px]">
                                {category.notes.length}
                              </span>
                            </div>
                          </div>

                          {/* 卡片网格 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 relative">
                            {category.notes.map((note, index) => (
                              <NoteCard
                                key={note.id}
                                note={note}
                                index={index}
                                searchQuery={searchQuery}
                                isFocused={note.id === focusedNoteId}
                                onJump={handleJump}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 flex flex-col items-center justify-center opacity-50 mt-10">
              <span className="text-xs text-[#888] tracking-widest font-[Outfit]">NO MATCHING RECORDS FOUND</span>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
});

export default Note;
