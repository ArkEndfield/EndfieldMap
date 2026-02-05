import { motion } from 'motion/react';

import { ScrollArea } from '@/components/common/scroll_area';
import { cn } from '@/utils/style';

import { CheckIcon, SyncIcon } from './icons';
import type { UidInfo } from '@/@types/user';

// ==================== UID 列表项组件 ====================
interface UidListItemProps {
  data: UidInfo;
  isActive: boolean;
  onDelete?: () => void;
  onSwitch?: () => void;
}

export const UidListItem = ({ data, isActive, onDelete, onSwitch }: UidListItemProps) => (
  <div
    className={cn(
      'flex items-center gap-3 px-3 py-2 transition-colors',
      'bg-black/30 hover:bg-black/50 border border-white/5',
      isActive && 'border-[#FDFB73]/30 bg-[#FDFB73]/5'
    )}
  >
    {/* 勾选图标 */}
    <div
      className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
        isActive ? 'bg-[#FDFB73] text-black' : 'bg-white/10 text-white/30'
      )}
    >
      <CheckIcon className="w-3 h-3" />
    </div>

    {/* UID 信息 */}
    <div className="flex-1 min-w-0">
      <span className="text-white font-medium">UID {data.uid}</span>
    </div>

    {/* 操作按钮 */}
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={onDelete}
        className="px-2 py-1 text-xs text-[#FDFB73]/70 hover:text-[#FDFB73] border border-[#FDFB73]/30 hover:border-[#FDFB73]/60 rounded transition-colors"
      >
        删除绑定
      </button>
      <button
        onClick={onSwitch}
        className="px-2 py-1 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-colors"
      >
        切换UID
      </button>
    </div>
  </div>
);

// ==================== UID 列表组件 ====================
interface UidListProps {
  uidList: UidInfo[];
  activeUid?: UidInfo['uid'];
  onDeleteUid?: (uid: string) => void;
  onSwitchUid?: (uid: string) => void;
}

export const UidList = ({ uidList, activeUid, onDeleteUid, onSwitchUid }: UidListProps) => (
  <motion.div
    className="flex-1 flex flex-col min-w-0 min-h-0"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.2 }}
  >
    {/* 列表标题 */}
    <div className="flex items-center gap-2 mb-3 shrink-0">
      <div className="w-5 h-5 rounded-full bg-[#FDFB73] flex items-center justify-center">
        <SyncIcon className="w-3 h-3 text-black" />
      </div>
      <h4 className="text-white font-medium">绑定的UID列表</h4>
    </div>

    {/* UID 列表滚动区域 */}
    <ScrollArea className="flex-1 min-h-0" scrollY scrollX={false} scrollbarY="auto" contentClassName="pr-2">
      <div className="flex flex-col gap-2">
        {uidList.map((item) => (
          <UidListItem
            key={item.uid}
            isActive={item.uid === activeUid}
            data={item}
            onDelete={() => onDeleteUid?.(item.uid)}
            onSwitch={() => onSwitchUid?.(item.uid)}
          />
        ))}
      </div>
    </ScrollArea>
  </motion.div>
);
