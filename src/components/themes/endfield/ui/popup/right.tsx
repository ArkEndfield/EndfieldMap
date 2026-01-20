import type { EntityData } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';

import { ScrollArea } from '@/components/common/scroll_area';
import { useAdapter } from '@/hooks/use_adapter';
import type { RightContentItem } from '@themes/endfield/ui/popup/right_content/items';
import { cn } from '@/utils/style';

export interface RightContentProps {
  isExpand: boolean;
  items: RightContentItem[];
}

export const RightContent = ({ items, entity }: { items: RightContentItem[]; entity: EntityData }) => {
  return (
    <>
      {items.map((item) => (
        <item.Component key={item.id} entity={entity} />
      ))}
    </>
  );
};

/** 右边弹窗内容 */
export const RightContentContainer: React.FC<RightContentProps> = observer(({ isExpand, items }) => {
  const { adapter } = useAdapter();
  const activeFeature = adapter?.activeFeatureController.activeFeature;
  const entity = activeFeature?.data;

  return (
    <AnimatePresence>
      {entity && (
        <motion.div
          initial={false}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className={cn(
            'shrink-0 transition-all duration-300 ease-in-out relative w-78 -z-2 flex h-full',
            'bg-[#272827] relative',
            'after:absolute after:opacity-20 after:right-0 after:bottom-0 after:left-0 after:h-24 after:-z-1 after:bg-[url(/images/bg/button-texture.png)] after:bg-cover after:bg-bottom-right after:bg-no-repeat after:mask-[linear-gradient(to_top,black_calc(100%-3rem),transparent)]',
            isExpand ? 'ml-1' : '-ml-78'
          )}
        >
          <ScrollArea contentClassName="w-full text-white text-xs" scrollbarX="hidden" className="flex-1">
            <RightContent items={items} entity={entity} />
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
