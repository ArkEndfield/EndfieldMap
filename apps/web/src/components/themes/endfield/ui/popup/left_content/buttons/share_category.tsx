import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, DecoTriTriangle, VisibleWithDeco } from '@endfieldmap/web-components';
import { motion } from 'motion/react';

import { getEntityIcon } from '@/utils/entity';

export interface CategoryItem {
  entityDataIdKey: string;
  category: string;
  name: string;
  pic: string;
}

export interface CategoryGroupData {
  category: string;
  name: string;
  items: CategoryItem[];
}

/** 单个实体标点选择项，复用左侧面板的胶囊样式 */
export const CategoryPill: React.FC<{
  item: CategoryItem;
  checked: boolean;
  onToggle: (key: string) => void;
}> = ({ item, checked, onToggle }) => (
  <ButtonWithAudio
    onClick={() => onToggle(item.entityDataIdKey)}
    className={cn('select-none w-full rounded-full overflow-hidden flex items-center', 'p-px relative text-xs')}
  >
    <div
      className={cn(
        'flex items-center gap-1 p-1 overflow-hidden w-full bg-[#1d1d1d] rounded-full relative z-1',
        'text-[#cccccc]',
        checked && 'text-[#4c4c4c]',
        !checked && 'hover:bg-[#222222]',
        'border-[0.5px] border-[#898989]/30'
      )}
    >
      <div
        className="absolute inset-0 rounded-full bg-[#fffa00] pointer-events-none"
        style={{
          width: checked ? '100%' : '0%',
          transition: 'width 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)',
        }}
      />
      <div className="w-5 h-4 flex justify-center items-center shrink-0 relative z-1">
        <div
          className={cn(
            'w-full h-full rounded-full flex items-center justify-center',
            'transition-all duration-200',
            checked ? 'bg-black/5' : 'bg-white/5'
          )}
        >
          {item.pic && (
            <img
              src={getEntityIcon(item.category, item.pic)}
              className={cn('w-full h-full object-contain', checked && 'drop-shadow-[0_0_5px_rgba(0,0,0,0.65)]')}
              alt=""
            />
          )}
        </div>
      </div>
      <span className="flex-1 min-w-0 text-left truncate relative z-1">{item.name}</span>
    </div>
  </ButtonWithAudio>
);

/** 可折叠的分类分组，复用左侧实体面板的分组交互 */
export const CategoryGroup: React.FC<{
  group: CategoryGroupData;
  checkedKeys: Set<string>;
  open: boolean;
  onToggleOpen: () => void;
  onToggleItem: (key: string) => void;
  onToggleAll: (keys: string[], checked: boolean) => void;
}> = ({ group, checkedKeys, open, onToggleOpen, onToggleItem, onToggleAll }) => {
  const keys = group.items.map((i) => i.entityDataIdKey);
  const checkedCount = keys.filter((k) => checkedKeys.has(k)).length;
  const allChecked = checkedCount === keys.length && keys.length > 0;

  return (
    <div className="w-full">
      <ButtonWithAudio
        className={cn(
          'flex items-center w-full gap-2 px-2 py-1.5',
          'border-b border-[#191919] bg-[linear-gradient(to_right,#3d3d3d,#272727)]'
        )}
        onClick={onToggleOpen}
      >
        <span
          className="shrink-0 flex items-center text-base"
          onClick={(e) => {
            e.stopPropagation();
            onToggleAll(keys, !allChecked);
          }}
        >
          <VisibleWithDeco style={{ color: allChecked ? '#f9f853' : '#888888' }} />
        </span>
        <span className="flex-1 text-left text-sm font-bold truncate">{group.name}</span>
        <span className="text-[0.65rem] text-white/40 tabular-nums shrink-0">
          {checkedCount}/{keys.length}
        </span>
        <DecoTriTriangle className={cn('text-xs transition-transform shrink-0', open && 'rotate-180')} />
      </ButtonWithAudio>

      <motion.div
        className="overflow-hidden"
        initial={false}
        animate={{ height: open ? 'auto' : 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="grid grid-cols-2 gap-x-1 gap-y-1.5 px-2 py-2">
          {group.items.map((item) => (
            <CategoryPill
              key={item.entityDataIdKey}
              item={item}
              checked={checkedKeys.has(item.entityDataIdKey)}
              onToggle={onToggleItem}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
