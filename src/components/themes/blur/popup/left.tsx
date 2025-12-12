import type { CustomPointIdKey } from '@endfieldmap/map-core';
import { customPointTypes } from '@endfieldmap/map-core/data/entity/custom_point';
import { CustomPointFeature } from '@endfieldmap/map-core/render/source/feature/custom_point_feature';
import { ElectricPoleFeature } from '@endfieldmap/map-core/render/source/feature/electric_pole_feature';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { Guide } from '@/components/common/guide';
import { EditIcon } from '@/components/common/icons';
import { ScrollArea } from '@/components/common/scroll_area';
import { useAdapter } from '@/hooks/use_adapter';
import { getEntityIcon } from '@/utils/entity';
import { cn } from '@/utils/style';

/** 顶部图标和标题 */
const Header = ({ name, pic }: { name: string; pic: string }) => (
  <div className="flex items-center gap-3 shrink-0 mb-3">
    <div className="shrink-0">
      <img src={pic} className="w-8 h-8 rounded-full" />
    </div>
    <div className="truncate overflow-hidden text-lg font-semibold">{name}</div>
  </div>
);

/** 选择器 */
const BlurSelect = ({
  value,
  options,
  onChange,
}: {
  value: CustomPointIdKey;
  options: Array<{ value: CustomPointIdKey; label: string; left: React.ReactNode }>;
  onChange: (value: CustomPointIdKey) => void;
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            'border transition-all duration-200',
            value === option.value
              ? 'bg-blue-500/20 border-blue-500/40 text-white'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
          )}
        >
          {option.left}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export const LeftContent = observer(({ className }: { className?: string }) => {
  const { adapter } = useAdapter();
  const { t } = useTranslation(['popup', 'common', 'entity_info']);
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
    return t(`entity_info:${entityData?.entityInfo.entityInfo.point}`, {
      defaultValue: entityData?.entityInfo.entityInfo.point || '',
    });
  }, [entityData, isElectricPole, isCustomPoint, t]);

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
          className={cn('relative z-1 flex flex-col', className)}
        >
          <Header
            name={displayName || ''}
            pic={getEntityIcon(entityData.entityInfo.category, entityData.entityInfo.entityInfo.pic)}
          />

          <div className="mb-3 text-xs text-white/50 shrink-0">ID: {entityData.levelLogicId}</div>

          <ScrollArea className="flex-1 min-h-0 mb-3">
            <Guide entity={entityData} />
          </ScrollArea>

          {/* 自定义标点类型选择 */}
          {isCustomPoint && (
            <div className="mb-3 shrink-0">
              <div className="text-xs text-white/60 mb-2">{t('popup:custom_point.change_type')}</div>
              <BlurSelect
                value={(activeFeature as CustomPointFeature).pointType}
                options={customPointTypeOptions}
                onChange={handleChangePointType}
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="shrink-0 flex gap-2 justify-end">
            {activeFeature.markable && (
              <button
                onClick={handleToggleMarked}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                  'transition-all duration-200',
                  activeFeature.marked
                    ? 'bg-blue-500/20 border border-blue-500/40 text-white'
                    : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/15 hover:text-white'
                )}
              >
                {activeFeature.marked ? t('common:operate.marked') : t('common:operate.mark')}
              </button>
            )}
            {(isElectricPole || isCustomPoint) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename();
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                  'bg-white/10 border border-white/20 text-white/70',
                  'hover:bg-white/15 hover:text-white',
                  'transition-all duration-200'
                )}
              >
                <EditIcon className="w-4 h-4" />
                {t('common:operate.rename')}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
