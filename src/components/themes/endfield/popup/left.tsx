import type { CustomPointIdKey } from '@endfieldmap/map-core';
import { customPointTypes } from '@endfieldmap/map-core/data/entity/custom_point';
import { CustomPointFeature } from '@endfieldmap/map-core/render/source/feature/custom_point_feature';
import { ElectricPoleFeature } from '@endfieldmap/map-core/render/source/feature/electric_pole_feature';
import { Toggle } from '@themes/endfield/components/toggle';
import { ClipSquare, Deco } from '@themes/endfield/popup/deco';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { ZmdButton } from '@/components/common/endfield_components/button';
import { EndfieldSelect } from '@/components/common/endfield_components/form/select';
import { Guide } from '@/components/common/guide';
import { EditIcon, PowerIcon } from '@/components/common/icons';
import { ScrollArea } from '@/components/common/scroll_area';
import { useAdapter } from '@/hooks/use_adapter';
import { getEntityIcon } from '@/utils/entity';
import { cn } from '@/utils/style';

/** 描边 */
const Border = () => (
  <div
    className="absolute inset-0 bottom-[18px] pointer-events-none -z-1"
    style={{
      filter: 'url(#stroke-filter)',
    }}
  >
    <ClipSquare className="bg-[#272827]" />
    <div className="w-full h-[calc(100%-1rem+1.5rem)] bg-[#272827]" />
  </div>
);

/** 关闭按钮 */
export const CloseButton = ({ onClick }: { onClick?: () => void }) => (
  <button className="no-underline absolute top-3 right-5 text-3xl text-[#ece065] z-2" onClick={onClick}>
    <PowerIcon />
  </button>
);

/** 顶部图标和标题 */
const Header = ({ name, pic }: { name: string; pic: string }) => (
  <div className="flex items-center gap-2 shrink-0">
    <div className="shrink-0">
      <img src={pic} className="w-6 h-6 rounded-full" />
    </div>
    <div className="truncate overflow-hidden">{name}</div>
  </div>
);

export const LeftContent = observer(({ className }: { className?: string }) => {
  const { adapter, dataService } = useAdapter();
  const { t } = useTranslation(['popup', 'common', 'lang']);
  const activeFeature = adapter.activeFeatureController.activeFeature;
  const entityData = activeFeature?.data;

  const isElectricPole = activeFeature instanceof ElectricPoleFeature;
  const isCustomPoint = activeFeature instanceof CustomPointFeature;
  const displayName = useMemo(() => {
    if (isElectricPole) {
      return (activeFeature as ElectricPoleFeature).name;
    } else if (isCustomPoint) {
      return (activeFeature as CustomPointFeature).name;
    }
    return t(`lang:${dataService.langHashDataService.getHash(entityData?.entityInfo.entityInfo.point)}`, {
      defaultValue: entityData?.entityInfo.entityInfo.point || '',
    });
  }, [entityData, isElectricPole, isCustomPoint]);

  const handleToggleMarked = () => {
    if (activeFeature) {
      activeFeature.toggleMarked();
    }
  };

  const handleRename = async () => {
    if (!activeFeature) return;

    if (isElectricPole) {
      const electricPole = activeFeature as ElectricPoleFeature;
      const currentName = electricPole.name;

      const newName = await alert.prompt({
        content: t('popup:electric_pole.rename_tip'),
        defaultValue: currentName,
      });

      if (newName && newName !== currentName) {
        electricPole.rename(newName);
      }
    } else if (isCustomPoint) {
      const customPoint = activeFeature as CustomPointFeature;
      const currentName = customPoint.name;

      const newName = await alert.prompt({
        content: t('popup:custom_point.rename_tip'),
        defaultValue: currentName,
      });

      if (newName && newName !== currentName) {
        customPoint.rename(newName);
      }
    }
  };

  const handleChangePointType = (newType: CustomPointIdKey) => {
    if (!activeFeature || !isCustomPoint) return;
    const customPoint = activeFeature as CustomPointFeature;
    customPoint.changePointType(newType);
  };

  const customPointTypeOptions = customPointTypes.map((type) => ({
    value: type.entityInfo.point,
    label: t(`common:custom_point.type.${type.entityInfo.point}`, { defaultValue: type.entityInfo.point }),
    left: <img className="w-4 h-4" src={getEntityIcon(type.category, type.entityInfo.pic)} />,
  }));

  return (
    <AnimatePresence mode="wait">
      {activeFeature && entityData && (
        <motion.div
          key={activeFeature.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn('relative z-1 flex flex-col min-h-60', className)}
        >
          <Header
            name={displayName || ''}
            pic={getEntityIcon(entityData.entityInfo.category, entityData.entityInfo.entityInfo.pic)}
          />

          <div className="my-2 text-sm flex flex-wrap items-center gap-2 px-4 shrink-0">
            <span className="ml-auto text-zinc-400">id: {entityData.levelLogicId}</span>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <Guide entity={entityData} />
          </ScrollArea>

          {/* 自定义标点类型选择 */}
          {isCustomPoint && (
            <div className="mt-3 shrink-0">
              <div className="text-xs text-[#aaaaaa] mb-1">{t('popup:custom_point.change_type')}</div>
              <EndfieldSelect
                value={(activeFeature as CustomPointFeature).pointType}
                options={customPointTypeOptions}
                onChange={handleChangePointType}
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="mt-3 pt-3 shrink-0 flex gap-2 justify-end">
            {activeFeature.markable && (
              <div className="bg-[#272727] rounded-full p-0.5">
                <Toggle
                  onToggle={() => {
                    handleToggleMarked();
                  }}
                  checked={activeFeature.marked}
                  label={activeFeature.marked ? t('common:operate.marked') : t('common:operate.mark')}
                />
              </div>
            )}
            {(isElectricPole || isCustomPoint) && (
              <ZmdButton
                classNames={{
                  text: 'text-sm',
                  icon: 'text-sm p-0.5',
                }}
                icon={<EditIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename();
                }}
              >
                {t('common:operate.rename')}
              </ZmdButton>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

/** 左边弹窗内容 */
export const LeftContentContainer: React.FC = observer(() => {
  const { adapter } = useAdapter();

  return (
    <div className={cn('w-78 shrink-0 h-auto', 'border-b-6 border-[#656465] relative')}>
      {/* 描边层 */}
      <Border />

      <CloseButton onClick={() => adapter.activeFeatureController.clearActiveFeature?.()} />

      <ClipSquare className="bg-[#272827]" />

      <div
        className={cn(
          'w-full bg-[#272827] text-white p-3 pt-0 shadow-[0_-2px_0_#272827] relative',
          'after:absolute after:z-0 after:left-0 after:h-32 after:bottom-0 after:w-54 after:bg-linear-to-tr after:from-white/25 after:via-white/0 after:to-black/0 after:pointer-events-none'
        )}
      >
        <Deco />

        <LeftContent className="max-h-78" />
      </div>
    </div>
  );
});
