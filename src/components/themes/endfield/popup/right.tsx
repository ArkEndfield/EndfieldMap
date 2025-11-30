import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';

import { DoubleChevronRight } from '@/components/common/icons';
import { ScrollArea } from '@/components/common/scroll_area';
import { useAdapter } from '@/hooks/use_adapter';
import { hasReward } from '@/utils/reward';
import { cn } from '@/utils/style';

import { ClipSquare } from './deco';
import { ChestReward } from './right_content/chest_reward';
import { DungeonReward } from './right_content/dungeon_reward';

export interface RightContentProps {
  isExpand: boolean;
  toggleExpand: () => void;
}

/** 描边 */
const Border = () => (
  <div
    className="absolute inset-0 pointer-events-none -z-1 flex"
    style={{
      filter: 'url(#stroke-filter)',
    }}
  >
    <div className="flex-1 flex flex-col">
      <ClipSquare className="bg-[#3E3E3E]" />
      <div className="w-full flex-1 bg-[#272827]" />
    </div>
  </div>
);

/** 折叠/展开按钮 */
const ToggleButton = ({ onClick, isExpand }: { onClick: () => void; isExpand: boolean }) => (
  <button className="shirnk-0 grow-0 flex flex-col w-6 h-full -ml-px" onClick={onClick}>
    <ClipSquare className="bg-[#3E3E3E]" />
    <div className="bg-[#3E3E3E] py-1.5 relative shadow-[0_-2px_0_#3E3E3E]">
      <div className="h-1 bg-[#4C4C4C] mr-1"></div>
    </div>
    <div className="[writing-mode:vertical-lr] bg-[#3E3E3E] shadow-[0_-2px_0_#3E3E3E] text-[#bfbfbf] font-black pb-6 flex-1 flex items-center justify-center text-2xl">
      <DoubleChevronRight
        className={cn('drop-shadow-[0_0_0.2em_rgba(191,191,191,0.8)] transition-transform', {
          'rotate-180': isExpand,
        })}
      />
    </div>
  </button>
);

export const RightContent = () => {
  const { adapter } = useAdapter();
  const activeFeature = adapter?.activeFeatureController.activeFeature;
  const entity = activeFeature?.data;
  const showRewards = hasReward(entity);
  if (!entity || !showRewards) {
    return null;
  }
  return (
    <>
      <ChestReward entity={entity} />
      <DungeonReward entity={entity} />
    </>
  );
};

/** 右边弹窗内容 */
export const RightContentContainer: React.FC<RightContentProps> = observer(({ isExpand, toggleExpand }) => {
  const { adapter } = useAdapter();
  const activeFeature = adapter?.activeFeatureController.activeFeature;
  const entity = activeFeature?.data;
  const showRewards = hasReward(entity);

  return (
    <AnimatePresence>
      {entity && showRewards && (
        <motion.div
          initial={false}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className={cn(
            'shrink-0 transition-all duration-300 ease-in-out relative -z-2',
            isExpand ? 'ml-3 translate-x-0 translate-y-0 w-64' : '-ml-72 translate-x-4 -translate-y-5 w-78'
          )}
        >
          <div className={cn('absolute transition-all -z-2 flex h-full', isExpand ? 'w-64' : 'w-78')}>
            {/* 描边层 */}
            <Border />

            <div className="bg-[#272827] text-white w-full flex flex-col">
              <ScrollArea contentClassName="p-4 pb-8" className="flex-1">
                <RightContent />
              </ScrollArea>
            </div>

            <ToggleButton onClick={toggleExpand} isExpand={isExpand} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
