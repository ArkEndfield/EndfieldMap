import { cn } from '@/utils/style';
import { PowerIcon } from '@/components/common/icons';
import { observer } from 'mobx-react-lite';
import { getEntityIcon } from '@/utils/entity';
import { ScrollArea } from '@/components/common/scroll_area';
import { ClipSquare, Deco } from './deco';
import { Guide } from '../../../common/guide';
import { ZmdButton } from '@/components/common/endfield_components/button';
import { useTranslation } from 'react-i18next';
import { useAdapter } from '@/hooks/use_adapter';
import { AnimatePresence, motion } from 'motion/react';
import { ElectricPoleFeature } from '@endfieldmap/map-core/render/source/feature/electric_pole_feature';
import { CustomPointFeature } from '@endfieldmap/map-core/render/source/feature/custom_point_feature';
import { alert } from '@/components/common/endfield_components/alert/alert_api';

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
  const { adapter } = useAdapter();
  const { t } = useTranslation(['popup', 'common']);
  const activeFeature = adapter.activeFeatureController.activeFeature;
  const entityData = activeFeature?.data;

  const isElectricPole = activeFeature instanceof ElectricPoleFeature;
  const isCustomPoint = activeFeature instanceof CustomPointFeature;
  const displayName = isElectricPole
    ? (activeFeature as ElectricPoleFeature).name
    : isCustomPoint
    ? (activeFeature as CustomPointFeature).name
    : entityData?.entityInfo.entityInfo.point;

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

          <div className="my-2 text-sm flex flex-wrap items-center gap-2 px-4 shrink-0">
            <span className="ml-auto text-zinc-400">id: {entityData.levelLogicId}</span>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <Guide entity={entityData} />
          </ScrollArea>

          {/* 操作按钮 */}
          <div className="mt-3 pt-3 shrink-0 flex gap-2">
            {activeFeature.markable && (
              <ZmdButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMarked();
                }}
                iconPosition={activeFeature.marked ? 'left' : 'right'}
              >
                {activeFeature.marked ? t('common:operate.unmark') : t('common:operate.mark')}
              </ZmdButton>
            )}
            {(isElectricPole || isCustomPoint) && (
              <ZmdButton
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
    <div className={cn('w-full', 'border-b-6 border-[#656465] relative')}>
      {/* 描边层 */}
      <Border />

      <CloseButton onClick={() => adapter.activeFeatureController.clearActiveFeature?.()} />

      <ClipSquare className="bg-[#272827]" />

      <div
        className={cn(
          'w-full bg-[#272827] text-white p-3 pt-0 shadow-[0_-2px_0_#272827] relative overflow-hidden',
          'after:absolute after:z-0 after:left-0 after:h-32 after:bottom-0 after:w-54 after:bg-linear-to-tr after:from-white/25 after:via-white/0 after:to-black/0'
        )}
      >
        <Deco />

        <LeftContent className="max-h-78" />
      </div>
    </div>
  );
});
