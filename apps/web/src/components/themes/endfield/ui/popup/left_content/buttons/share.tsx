import type { DataInstance } from '@endfieldmap/map-core';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, ShareIcon, Tooltip } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/hooks/use_adapter';
import { buildShareLink, copyShareLink } from '@/services/share_link';
import { getEntityIcon } from '@/utils/entity';

interface CategoryItem {
  entityDataIdKey: string;
  category: string;
  name: string;
  pic: string;
  visible: boolean;
}

const CategoryCheckbox: React.FC<{
  item: CategoryItem;
  checked: boolean;
  onChange: (key: string, checked: boolean) => void;
}> = ({ item, checked, onChange }) => {
  return (
    <label
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 cursor-pointer',
        'hover:bg-white/5 transition-colors',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(item.entityDataIdKey, e.target.checked)}
        className="accent-[#fcee21] w-3.5 h-3.5 shrink-0"
      />
      {item.pic && (
        <img
          src={getEntityIcon(item.category, item.pic)}
          className="w-4 h-4 shrink-0"
          alt=""
        />
      )}
      <span className="text-xs text-white/80 truncate">{item.name}</span>
    </label>
  );
};

export interface ShareButtonProps {
  entity: DataInstance;
}

export const ShareButton: React.FC<ShareButtonProps> = observer(({ entity }) => {
  const { t } = useTranslation('common');
  const { adapter } = useAdapter();
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const categories: CategoryItem[] = adapter.entityController.currentStats
    .filter((s) => s.mapId === entity.mapId)
    .map((s) => ({
      entityDataIdKey: s.entityDataIdKey,
      category: s.category,
      name: t(`lang:${s.entityDataIdKey}`, { defaultValue: s.entityDataIdKey }),
      pic: s.entityInfo?.pic || '',
      visible: s.visible,
    }));

  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (showPopover) {
      setCheckedKeys(new Set(categories.filter((c) => c.visible).map((c) => c.entityDataIdKey)));
    }
  }, [showPopover]);

  const handleToggle = useCallback((key: string, checked: boolean) => {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
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

  return (
    <div className="relative" ref={buttonRef}>
      <Tooltip
        tooltip={t('share.copy_link')}
        as={ButtonWithAudio}
        placement="bottom"
        asProps={{
          className: cn('text-xl p-1', showPopover && 'text-[#fcee21]'),
          onClick: () => setShowPopover((v) => !v),
        }}
      >
        <ShareIcon />
      </Tooltip>

      <AnimatePresence>
        {showPopover && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.25 }}
            className={cn(
              'absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50',
              'w-56 bg-[#1e1e1e]/95 backdrop-blur-sm',
              'border border-[#4a4a2a] shadow-[0_4px_24px_rgba(0,0,0,0.6)]',
            )}
          >
            <div className="px-2 py-1.5 text-xs text-white/50 border-b border-[#383938]">
              {t('share.select_categories')}
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {categories.map((cat) => (
                <CategoryCheckbox
                  key={cat.entityDataIdKey}
                  item={cat}
                  checked={checkedKeys.has(cat.entityDataIdKey)}
                  onChange={handleToggle}
                />
              ))}
            </div>
            <div className="border-t border-[#383938] p-2">
              <ButtonWithAudio
                className={cn(
                  'w-full py-1.5 text-xs text-center',
                  'bg-[#fcee21]/10 text-[#fcee21] hover:bg-[#fcee21]/20 transition-colors',
                )}
                onClick={handleCopy}
              >
                {t('share.confirm_copy')}
              </ButtonWithAudio>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
