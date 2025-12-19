import type { CustomPointTypeId } from '@endfieldmap/map-core';
import { CustomPointDataInstance, CustomPointKey, customPointTypes, ElectricPoleKey } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
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
  value: CustomPointTypeId;
  options: Array<{ value: CustomPointTypeId; label: string; left: React.ReactNode }>;  onChange: (value: CustomPointTypeId) => void;
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
  const { adapter, dataService } = useAdapter();
  const { t } = useTranslation(['popup', 'common', 'lang']);
  const activeFeature = adapter.activeFeatureController.activeFeature;
  const entityInfo = activeFeature?.entityInfo;

  const isElectricPole = entityInfo?.category === ElectricPoleKey;
  const isCustomPoint = entityInfo?.category === CustomPointKey;
  const displayName = (() => {
    if (isElectricPole && activeFeature) {
      return activeFeature.name;
    } else if (isCustomPoint && activeFeature) {
      return activeFeature.name;
    }
    return t(`lang:${dataService.langHashDataService.getHash(entityInfo?.entityInfo.point)}`, {
      defaultValue: entityInfo?.entityInfo.point || '',
    });
  })();

  const handleToggleMarked = () => {
    if (activeFeature?.toggleMarked) {
      activeFeature.toggleMarked();
    }
  };

  const handleRename = async () => {
    if (!activeFeature || !activeFeature.rename) return;

    const currentName = activeFeature.name;
    const content = isElectricPole
      ? t('popup:electric_pole.rename_tip')
      : t('popup:custom_point.rename_tip');

    const newName = await alert.prompt({
      content,
      defaultValue: currentName,
    });

    if (newName && newName !== currentName) {
      activeFeature.rename(newName);
    }
  };

  const handleChangePointType = (newType: CustomPointTypeId) => {
    if (!activeFeature || !isCustomPoint) return;
    
    // 使用 DataInstance 的 changeType API
    if ('changeType' in activeFeature && typeof activeFeature.changeType === 'function') {
      activeFeature.changeType(newType);
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
          className={cn('relative z-1 flex flex-col', className)}
        >
          <Header
            name={displayName || ''}
            pic={getEntityIcon(entityInfo.category, entityInfo.entityInfo.pic)}
          />

          <div className="mb-3 text-xs text-white/50 shrink-0">ID: {activeFeature.id}</div>

          <ScrollArea className="flex-1 min-h-0 mb-3">
            <Guide entity={activeFeature.data} />
          </ScrollArea>

          {/* 自定义标点类型选择 */}
          {isCustomPoint && (
            <div className="mb-3 shrink-0">
              <div className="text-xs text-white/60 mb-2">{t('popup:custom_point.change_type')}</div>
              <BlurSelect
                value={(activeFeature as CustomPointDataInstance).typeId}
                options={customPointTypeOptions}
                onChange={handleChangePointType}
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="shrink-0 flex gap-2 justify-end">
            {activeFeature.markable === true && (
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
