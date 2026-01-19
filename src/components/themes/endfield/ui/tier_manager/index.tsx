import { useAdapter } from '@/hooks/use_adapter';
import { cn } from '@/utils/style';
import { observer } from 'mobx-react-lite';
import { TierTitle } from '@themes/endfield/ui/tier_manager/tier_title';
import { ScrollableList, ScrollableListItem } from '@/components/common/scrollable_list';
import { AnimatePresence, motion } from 'motion/react';

interface TierManagerProps {
  className?: string;
}

// 动画过渡配置
const tierItemTransition = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
};

const TierManager = observer(({ className }: TierManagerProps) => {
  const { dataService, adapter } = useAdapter();
  const availableTierData = dataService.gridTiersDataService.availableTierData;
  const activeTierData = dataService.gridTiersDataService.activeTierData;
  const activeSubTierData = dataService.gridTiersDataService.activeSubTierData;
  const inactiveTierData = dataService.gridTiersDataService.inactiveTierData;

  return (
    <div className={cn('text-white text-xs w-32 bottom-0 left-0 fixed', className)}>
      <ScrollableList
        className={cn('h-24', activeTierData && 'h-16')}
        centerId={availableTierData?.id}
        idleTimeout={5000}
      >
        <AnimatePresence initial={false}>
          {inactiveTierData.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{
                opacity: 0,
                height: 0,
                transition: {
                  height: { delay: 0.2, duration: 0.2 },
                  default: { duration: 0.2 },
                },
              }}
              transition={tierItemTransition}
              className="overflow-hidden"
            >
              <ScrollableListItem className="p-0.5" id={item.id}>
                <TierTitle
                  onClick={() => {
                    adapter.tierController.toggleTier(adapter.currentMapIndex, item.id);
                  }}
                  className={cn('opacity-50', availableTierData?.id === item.id && 'opacity-90')}
                  animate={{
                    x: 0,
                    transition: { delay: 0.2, duration: 0.2 },
                  }}
                >
                  {item.name}
                </TierTitle>
              </ScrollableListItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollableList>

      {/* Active tier info */}
      <AnimatePresence mode="popLayout">
        {activeTierData && (
          <motion.div className="relative mt-1" key={activeTierData.id}>
            <TierTitle>{activeTierData.name}</TierTitle>
            <motion.div
              layout
              className="overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.1 } }}
              transition={tierItemTransition}
            >
              <AnimatePresence mode="popLayout">
                {activeTierData.items.map((item) => (
                  <motion.div
                    key={`${activeTierData.id}-${item.id}`}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={tierItemTransition}
                    onClick={() => {
                      adapter.tierController.toggleTier(adapter.currentMapIndex, activeTierData.id, item.id);
                    }}
                    className={cn(activeSubTierData?.id === item.id && 'ring-1 ring-amber-400')}
                  >
                    {item.name}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default TierManager;
