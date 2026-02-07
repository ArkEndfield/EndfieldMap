import { motion } from 'motion/react';

import { ScrollArea } from '@/components/common/scroll_area';
import { cn } from '@/utils/style';

import type { UidInfo } from '@/@types/user';
import { BindIcon, CheckCircleIcon, QuestionIcon } from '@/components/common/icons';

// ==================== UID 列表项组件 ====================
const UidListItem = ({
  data,
  isChecked,
  onCheckChange,
  renderActions,
}: {
  data: UidInfo;
  isChecked: boolean;
  onCheckChange?: (data: UidInfo) => void;
  renderActions?: (data: UidInfo) => React.ReactNode;
}) => (
  <div
    className={cn(
      'flex items-center gap-3 px-3 py-2 transition-colors',
      'bg-black/30 hover:bg-black/50 border border-white/5',
      isChecked && 'border-[#FDFB73]/30 bg-[#FDFB73]/5'
    )}
  >
    {/* 勾选图标 */}
    <button
      type="button"
      onClick={() => onCheckChange?.(data)}
      className={cn(
        'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors',
        isChecked ? 'bg-[#FDFB73] text-black' : 'bg-white/10 text-white/30 hover:bg-white/20'
      )}
    >
      <CheckCircleIcon className="w-3 h-3" />
    </button>

    {/* 头像 */}
    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
      <img src={data.avatar} alt="" className="w-full h-full object-cover" />
    </div>

    {/* UID 信息 */}
    <div className="flex-1 min-w-0">
      <span className="text-white font-medium">UID {data.uid}</span>
    </div>

    {/* 操作按钮 */}
    {renderActions && <div className="flex items-center gap-2 shrink-0">{renderActions(data)}</div>}
  </div>
);

// ==================== UID 列表组件 ====================
export const UidList = ({
  uidList,
  isChecked,
  onCheckChange,
  renderActions,
}: {
  uidList: UidInfo[];
  isChecked?: (data: UidInfo) => boolean;
  onCheckChange?: (data: UidInfo) => void;
  renderActions?: (data: UidInfo) => React.ReactNode;
}) => (
  <motion.div
    className="flex-1 flex flex-col min-w-0 min-h-0"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.2 }}
  >
    {/* 列表标题 */}
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-5 h-5 rounded-full bg-[#FDFB73] text-black flex items-center justify-center">
        <BindIcon />
      </div>
      <h4 className="text-white font-medium">绑定的UID列表</h4>
    </div>

    {/* UID 列表滚动区域 */}
    {uidList.length === 0 ? (
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <QuestionIcon className="w-6 h-6" />
        <span className="text-white/50 text-xs">未绑定UID</span>
      </div>
    ) : (
      <ScrollArea className="flex-1 min-h-0" scrollY scrollX={false} scrollbarY="auto" contentClassName="pr-2">
        <div className="flex flex-col gap-2">
          {uidList.map((item) => (
            <UidListItem
              key={item.uid}
              data={item}
              isChecked={isChecked?.(item) ?? false}
              onCheckChange={onCheckChange}
              renderActions={renderActions}
            />
          ))}
        </div>
      </ScrollArea>
    )}
  </motion.div>
);
