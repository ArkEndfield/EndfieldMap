import { useAdapter } from '@/hooks/use_adapter';
import { cn } from '@/utils/style';
import { observer } from 'mobx-react-lite';
import { TierTitle } from '@themes/endfield/ui/tier_manager/tier_title';
import { AnimatePresence, motion } from 'motion/react';
import { ScrollableList, ScrollableListItem } from '@/components/common/scrollable_list';
import { useEndfieldUIManager } from '@themes/endfield/hooks/ui_manager';
import { SubTitle } from '@themes/endfield/ui/tier_manager/subtitle';

interface TierManagerProps {
  className?: string;
}

const TierManager = observer(({ className }: TierManagerProps) => {
  const { dataService, adapter } = useAdapter();
  const uiManager = useEndfieldUIManager();
  const isSidePanelOpen = uiManager.operatePanelOpen.value;
  const availableTierData = dataService.gridTiersDataService.availableTierData;
  const activeTierData = dataService.gridTiersDataService.activeTierData;
  const activeSubTierData = dataService.gridTiersDataService.activeSubTierData;
  const allTierData = dataService.gridTiersDataService.currentTierData;

  return (
    <div
      className={cn(
        'text-white text-xs bottom-0 fixed overflow-hidden transition-[left] ease-in-out duration-300 group/list',
        isSidePanelOpen ? 'left-82 delay-100' : '-left-4',
        className
      )}
    >
      <ScrollableList
        className={cn(
          'max-h-24 relative md:group-hover/list:max-h-64 transition-[max-height] ease-in-out duration-300 -left-4 w-fit',
          activeTierData && 'max-h-16'
        )}
        centerId={availableTierData?.id}
        idleTimeout={5000}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {allTierData.map((item) => (
            <motion.div
              layout
              initial={{ opacity: 0, filter: 'blur(2px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(2px)' }}
              transition={{ duration: 0.3, type: 'spring', bounce: 0 }}
              key={item.id}
              className="overflow-hidden"
            >
              <ScrollableListItem className="p-0.5" id={item.id}>
                <TierTitle
                  onClick={() => {
                    adapter.tierController.toggleTier(adapter.currentMapIndex, item.center, item.id);
                  }}
                  className={cn(
                    'opacity-50',
                    availableTierData?.id === item.id && 'opacity-80 ring-1 ring-[#FEFA53]/40',
                    activeTierData?.id === item.id && 'opacity-100 ring-1 ring-[#FEFA53]'
                  )}
                >
                  ./{item.name}
                </TierTitle>
              </ScrollableListItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollableList>

      {/* Active tier info */}
      <AnimatePresence mode="wait">
        {activeTierData && (
          <motion.div
            initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0 }}
            className="relative mt-1"
            key={activeTierData.id}
          >
            <TierTitle
              className="pl-9 w-fit gap-6"
              onClick={() => {
                adapter.tierController.toggleTier(adapter.currentMapIndex, activeTierData.center, activeTierData.id);
              }}
            >
              ./{activeTierData.name}
            </TierTitle>
            <motion.div
              className={cn(
                'ml-8 pb-5 relative',
                'after:absolute after:top-0 after:w-0.5 after:bottom-0 after:bg-white/50 after:left-20'
              )}
              layout
            >
              {activeTierData.items.map((item) => (
                <SubTitle
                  active={activeSubTierData?.id === item.id}
                  key={`${activeTierData.id}-${item.id}`}
                  onClick={() => {
                    adapter.tierController.toggleTier(adapter.currentMapIndex, activeTierData.center, activeTierData.id, item.id);
                  }}
                >
                  {item.name}
                </SubTitle>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default TierManager;
