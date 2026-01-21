import type { CustomPointTypeId } from '@endfieldmap/map-core';
import { CustomPointDataInstance, CustomPointKey, customPointTypes } from '@endfieldmap/map-core';
import { Footer } from '@themes/endfield/ui/popup/left_content/footer';
import { PopupHeader } from '@themes/endfield/ui/popup/left_content/header';
import { MarkButton } from '@themes/endfield/ui/popup/left_content/mark_button';
import { RenameButton } from '@themes/endfield/ui/popup/left_content/rename_button';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { ZmdRoundIconButton } from '@/components/common/endfield_components/button/round_icon_button';
import { EndfieldSelect } from '@/components/common/endfield_components/form/select';
import { Guide } from '@/components/common/guide';
import { ChevronUpTriangle } from '@/components/common/icons';
import { ScrollArea } from '@/components/common/scroll_area';
import { useAdapter } from '@/hooks/use_adapter';
import { useActiveFeatureName } from '@/hooks/use_entity_name';
import { getEntityIcon } from '@/utils/entity';
import { cn } from '@/utils/style';

export const LeftContent = observer(({ className }: { className?: string }) => {
  const { adapter } = useAdapter();
  const { t } = useTranslation(['popup', 'common']);
  const activeFeature = adapter.activeFeatureController.activeFeature;
  const entityInfo = activeFeature?.entityInfo;

  const isCustomPoint = entityInfo?.category === CustomPointKey;
  const { name: displayName, categoryName } = useActiveFeatureName(activeFeature);

  const handleChangePointType = (newType: CustomPointTypeId) => {
    if (!activeFeature || !isCustomPoint) return;

    // 使用 DataInstance 的 changeType API
    (activeFeature as CustomPointDataInstance).changeType?.(newType);
  };

  const customPointTypeOptions = customPointTypes.map((type) => ({
    value: type.id,
    label: t(`common:custom_point.type.${type.id}`, { defaultValue: type.id }),
    left: <img className="w-4 h-4" src={getEntityIcon(CustomPointKey, type.icon)} />,
  }));

  return (
    <AnimatePresence mode="wait">
      {activeFeature && entityInfo && (
        <motion.div
          key={activeFeature.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn('relative z-1 flex flex-col h-full', className)}
        >
          <PopupHeader onClose={() => adapter.activeFeatureController.clearActiveFeature?.()}>
            <MarkButton entity={activeFeature} />
            <RenameButton entity={activeFeature} />
          </PopupHeader>

          <ScrollArea className="flex-1 min-h-0 p-3">
            <Guide entity={activeFeature.data} />

            {/* 自定义标点类型选择 */}
            {isCustomPoint && (
              <div className="mt-3 shrink-0">
                <div className="text-xs text-[#aaaaaa] mb-1">{t('popup:custom_point.change_type')}</div>
                <EndfieldSelect
                  value={(activeFeature as CustomPointDataInstance).typeId}
                  options={customPointTypeOptions}
                  onChange={handleChangePointType}
                />
              </div>
            )}
          </ScrollArea>

          <Footer
            name={displayName || ''}
            pic={getEntityIcon(entityInfo.category, entityInfo.entityInfo.pic)}
            id={activeFeature.id}
            categoryName={categoryName}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
});

/** 左边弹窗内容 */
export const LeftContentContainer: React.FC<{
  showSubPopup: boolean;
  toggleExpand: () => void;
  isExpanded: boolean;
}> = ({ showSubPopup, toggleExpand, isExpanded }) => {
  return (
    <div
      className={cn(
        'w-78 shrink-0 h-full relative',
        'border-b-4 border-[#656465] relative bg-[#272827] text-white pt-0',
        'after:absolute after:opacity-20 after:right-0 after:bottom-0 after:left-0 after:h-24 after:bg-[url(/images/bg/button-texture.png)] after:bg-cover after:bg-bottom-right after:bg-no-repeat after:mask-[linear-gradient(to_top,black_calc(100%-3rem),transparent)]'
      )}
    >
      <LeftContent />
      {showSubPopup && (
        <ZmdRoundIconButton
          className={cn(
            'absolute top-1/2 -translate-y-1/2 z-1 w-4 h-12 transition-all',
            isExpanded ? '-right-2.5' : ' -right-2'
          )}
          onClick={toggleExpand}
        >
          <ChevronUpTriangle className={cn('transition-transform text-xs', !isExpanded ? 'rotate-90' : 'rotate-270')} />
        </ZmdRoundIconButton>
      )}
    </div>
  );
};
