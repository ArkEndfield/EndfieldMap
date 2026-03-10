import type { CustomPointTypeId } from '@endfieldmap/map-core';
import { CustomPointDataInstance, CustomPointKey, customPointTypes, ElectricPoleKey } from '@endfieldmap/map-core';
import { cn } from '@endfieldmap/tools';
import { EndfieldSelect, ScrollArea, ZmdRoundIconButton } from '@endfieldmap/web-components';
import { ChevronUpTriangle } from '@endfieldmap/web-components';
import { Footer } from '@themes/endfield/ui/popup/left_content/footer';
import { PopupHeader } from '@themes/endfield/ui/popup/left_content/header';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Guide } from '@/components/common/guide';
import { DeleteButton } from '@/components/themes/endfield/ui/popup/left_content/buttons/delete_button';
import { MarkButton } from '@/components/themes/endfield/ui/popup/left_content/buttons/mark_button';
import { PlayVideoButton } from '@/components/themes/endfield/ui/popup/left_content/buttons/play_video';
import { RenameButton } from '@/components/themes/endfield/ui/popup/left_content/buttons/rename_button';
import { useAdapter } from '@/hooks/use_adapter';
import { useActiveFeatureName } from '@/hooks/use_entity_name';
import { service } from '@/services';
import { getEntityIcon } from '@/utils/entity';

const glowShadow = (opacity: number, blur = 6) => `0 0 ${blur}px rgba(252,238,33,${opacity})`;

const UnrefreshableTip = () => {
  return (
    <div className="relative py-0.5 pl-1.5 pr-1.5 text-xs">
      {/* 淡底 + 主题色发光（直角轮廓，呼吸动画） */}
      <motion.div
        className="absolute inset-0 bg-white/6 ring-[0.5px] ring-white/10"
        animate={{
          boxShadow: [glowShadow(0.2), glowShadow(0.6, 8), glowShadow(0.2)],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* 四角 L 形角标，更小 */}
      <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-[#fcee21]/90" />
      <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-[#fcee21]/90" />
      <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-[#fcee21]/90" />
      <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-[#fcee21]/90" />
      {/* TODO: i18n */}
      <span className="relative z-1 text-[#fcee21] font-medium tracking-wide">一次性</span>
    </div>
  );
};

const LeftContent = observer(({ className }: { className?: string }) => {
  const { adapter } = useAdapter();
  const { t } = useTranslation(['popup', 'common']);
  const [videoLink, setVideoLink] = useState<string>('');
  const [unRefreshable, setUnRefreshable] = useState<boolean>(false);
  const activeFeature = adapter.activeFeatureController.activeFeature;
  const entityInfo = activeFeature?.entityInfo;

  const isCustomPoint = entityInfo?.category === CustomPointKey;
  const isElectricPole = entityInfo?.category === ElectricPoleKey;

  const { name: displayName, categoryName } = useActiveFeatureName(activeFeature);

  const handleChangePointType = async (newType: CustomPointTypeId) => {
    if (!activeFeature || !isCustomPoint) return;

    try {
      await service.dataService.mapDataService.customPointDataService.changePointType(
        activeFeature.mapId,
        activeFeature.id,
        newType
      );
    } catch (error) {
      console.error('Failed to change point type:', error);
    }
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
          <PopupHeader onClose={() => adapter.activeFeatureController.clearActiveFeature?.()} start={unRefreshable && <UnrefreshableTip />}>
            <PlayVideoButton videoLink={videoLink} />
            <MarkButton entity={activeFeature} />
            <RenameButton entity={activeFeature} />
            <DeleteButton entity={activeFeature} />
          </PopupHeader>

          <div className="flex-1 min-h-0 relative">
            <ScrollArea className="h-full">
              <div className="pb-12">
                {!isCustomPoint && !isElectricPole && <Guide entity={activeFeature.data} onVideoLinkChange={setVideoLink} onUnRefreshableChange={setUnRefreshable} />}

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
              </div>
            </ScrollArea>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-[#272827] to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-2">
            <Footer
              name={displayName || ''}
              pic={getEntityIcon(entityInfo.category, entityInfo.entityInfo.pic)}
              id={activeFeature.id}
              categoryName={categoryName}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

/** 左边弹窗内容 */
const LeftContentContainer: React.FC<{
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

export { LeftContent, LeftContentContainer };
