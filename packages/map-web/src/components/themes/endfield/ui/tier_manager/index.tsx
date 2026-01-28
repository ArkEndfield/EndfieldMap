import { useEndfieldUIManager } from '@themes/endfield/hooks/ui_manager';
import { SubTitle } from '@themes/endfield/ui/tier_manager/subtitle';
import { TierTitle } from '@themes/endfield/ui/tier_manager/tier_title';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { ScrollableList, ScrollableListItem } from '@/components/common/scrollable_list';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import uiManager from '@/services/ui_manager';
import { cn } from '@/utils/style';

interface TierManagerProps {
  className?: string;
}

const TierManager = observer(({ className }: TierManagerProps) => {
  const { mapDataService, adapter } = useAdapter();
  const { t } = useTranslation('lang');
  const efUIManager = useEndfieldUIManager();
  const isMobile = useIsMobile();
  const isSidePanelOpen = efUIManager.isSidePanelOpen;
  const isNonEmptyPanel = efUIManager.isNonEmptyPanel;
  const availableTierData = mapDataService.gridTiersDataService.availableTierData;
  const activeTierData = mapDataService.gridTiersDataService.activeTierData;
  const activeSubTierData = mapDataService.gridTiersDataService.activeSubTierData;
  const allTierData = mapDataService.gridTiersDataService.currentTierData;

  const enableTier = uiManager.enableTier.value;

  return (
    <div
      className={cn(
        'text-white text-xs bottom-0 fixed overflow-hidden transition-[left] ease-in-out duration-300 group/list',
        isSidePanelOpen && !isMobile ? 'left-82 delay-100' : '-left-4',
        isMobile && isNonEmptyPanel && 'bottom-15',
        'lg:text-sm',
        className
      )}
    >
      <AnimatePresence>
        {enableTier && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <ScrollableList
              className={cn(
                'max-h-24 relative md:group-hover/list:max-h-64 transition-[max-height] ease-in-out duration-300 -left-8 w-fit',
                activeTierData && 'max-h-16',
                'lg:max-h-32 lg:group-hover/list:max-h-80 lg:gap-2'
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
                    className="overflow-hidden pr-2"
                  >
                    <ScrollableListItem className={cn('p-0.5 lg:p-1')} id={item.id}>
                      <TierTitle
                        onClick={() => {
                          adapter.tierController.toggleTier(
                            adapter.mapController.dataManager.currentMapId,
                            item.center,
                            item.id
                          );
                        }}
                        className={cn(
                          'opacity-50 md:hover:translate-x-2',
                          availableTierData?.id === item.id && 'opacity-80 ring-1 ring-[#FEFA53]/40',
                          activeTierData?.id === item.id && 'opacity-100 ring-1 ring-[#FEFA53] text-[#FEFA53]'
                        )}
                      >
                        ./{t(`lang:${item.items?.[0].name}`, { defaultValue: 'None' })}
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
                    onClick={() => {
                      adapter.tierController.toggleTier(
                        adapter.mapController.dataManager.currentMapId,
                        activeTierData.center,
                        activeTierData.id
                      );
                    }}
                  >
                    ./
                    {t(`lang:${activeTierData.items?.[0].name}`, {
                      defaultValue: 'None',
                    })}
                  </TierTitle>
                  <div
                    className={cn(
                      'ml-8 mt-1.5 pb-5 relative',
                      'after:absolute after:top-0 after:w-0.5 after:bottom-0 after:bg-white/50 after:left-20',
                      'lg:ml-10 lg:mt-2.5 lg:pb-6 lg:after:left-24'
                    )}
                  >
                    {activeTierData.items.map((item) => (
                      <SubTitle
                        active={activeSubTierData?.id === item.id}
                        key={`${activeTierData.id}-${item.id}`}
                        onClick={() => {
                          adapter.tierController.toggleTier(
                            adapter.mapController.dataManager.currentMapId,
                            activeTierData.center,
                            activeTierData.id,
                            item.id
                          );
                        }}
                      >
                        {item.name}
                      </SubTitle>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default TierManager;
