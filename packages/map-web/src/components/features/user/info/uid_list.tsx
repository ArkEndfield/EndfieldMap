import type { UidInfo } from '@endfieldmap/map-service';
import { useTranslation } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { ScrollArea } from '@endfieldmap/web-components';
import { motion } from 'motion/react';

import { BindIcon, CheckCircleIcon, QuestionIcon } from '@endfieldmap/web-components';

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
}) => {
  const { t } = useTranslation('header');
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 transition-colors',
        'bg-black/30 border border-white/5',
        isChecked ? 'border-[#FDFB73]/30 bg-[#FDFB73]/5' : 'hover:bg-black/50'
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
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
        {data.avatar ? (
          <img src={data.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <svg className="w-5 h-5 text-white/30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        )}
      </div>

      {/* UID 信息 */}
      <div className="flex-1 min-w-0">
        <span className="text-white font-medium">{data.uid === '0' ? t('user.uid.default') : `UID ${data.uid}`}</span>
      </div>

      {/* 操作按钮 */}
      {renderActions && <div className="flex items-center gap-2 shrink-0">{renderActions(data)}</div>}
    </div>
  );
};

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
}) => {
  const { t } = useTranslation('header');
  return (
    <motion.div
      className="flex-1 flex flex-col min-w-0 min-h-0 font-[Outfit]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      {/* 列表标题 */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-5 h-5 rounded-full bg-[#FDFB73] text-black flex items-center justify-center">
          <BindIcon />
        </div>
        <h4 className="text-white font-medium">{t('user.uid.list')}</h4>
      </div>

      {/* UID 列表滚动区域 */}
      {uidList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <QuestionIcon className="w-6 h-6" />
          <span className="text-white/50 text-xs">{t('user.uid.not_bind')}</span>
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0 mt-2" scrollY scrollX={false} scrollbarY="auto" contentClassName="pr-2">
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
};
