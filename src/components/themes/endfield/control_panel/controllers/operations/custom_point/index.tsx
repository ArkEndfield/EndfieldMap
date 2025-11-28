import { Sheet, type SheetRef } from 'react-modal-sheet';
import { observer } from 'mobx-react-lite';
import CustomPointPresetPanel from './custom_point_preset_panel';
import CustomPointList from './custom_point_list';
import CustomPointTypeSelector from './custom_point_type_selector';
import { cn } from '@/utils/style';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { snapPoints } from '@/const/ui';
import { forwardRef, useRef, useState } from 'react';
import { useCustomPointMode, type CustomPointMode } from '@/hooks/use_custom_point_mode';
import { useTranslation } from 'react-i18next';
import { OperatorToggleButton } from '../components/button';
import { CloseIcon, PlusIcon } from '@/components/common/icons';
import { Toggle } from '../components/toggle';
import { EndfieldSwitch } from '@/components/common/endfield_components/form/switch';
import { AnimatePresence, motion } from 'motion/react';

const CustomPointManagerToolbar = observer(() => {
  const { changeMode, getCurrentMode, toggleMode } = useCustomPointMode();
  const { t } = useTranslation('sidebar');
  const currentMode = getCurrentMode();
  // 配置按钮数据
  const tools: { key: CustomPointMode; label: string; icon: React.ReactNode }[] = [
    {
      key: 'isCreating',
      label: t('operation.custom_point.create.start'),
      icon: <PlusIcon />,
    },
    {
      key: 'isDeleting',
      label: t('operation.custom_point.delete.start'),
      icon: <CloseIcon />,
    },
  ];
  return (
    <div className="flex gap-1 px-1 shrink-0">
      {tools.map((tool) => (
        <OperatorToggleButton
          key={tool.key}
          label={tool.label}
          icon={tool.icon}
          isActive={currentMode === tool.key}
          onClick={() => changeMode(tool.key)}
          onActiveClick={() => toggleMode(tool.key)}
        />
      ))}
    </div>
  );
});

export const CustomPointModeTip = observer(() => {
  const { getCurrentModeTipText } = useCustomPointMode();
  const { t } = useTranslation('sidebar');
  const tipText = getCurrentModeTipText();
  const lastTipTextRef = useRef(tipText);

  if (tipText) {
    lastTipTextRef.current = tipText;
  }

  const displayText = tipText ?? lastTipTextRef.current;
  if (!displayText) return null;
  return t(`operation.custom_point.${displayText}.in_mode`);
});

const AnimationWrapper = ({ children, direction }: { children: React.ReactNode; direction: 'left' | 'right' }) => {
  const variants = {
    enter: {
      x: direction === 'left' ? -300 : 300,
      opacity: 0,
    },
    center: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: direction === 'left' ? -300 : 300,
      opacity: 0,
    },
  };

  return (
    <motion.div
      className="w-full h-full flex-1 flex flex-col overflow-hidden"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        duration: 0.1,
      }}
    >
      {children}
    </motion.div>
  );
};

const TabContent = ({ showListTab }: { showListTab: boolean }) => {
  return (
    <AnimatePresence mode="wait">
      {showListTab ? (
        <AnimationWrapper key="list" direction="left">
          <CustomPointList />
        </AnimationWrapper>
      ) : (
        <AnimationWrapper key="preset" direction="right">
          <CustomPointPresetPanel />
        </AnimationWrapper>
      )}
    </AnimatePresence>
  );
};

export interface CustomPointManagerProps {
  open: boolean;
}

export const CustomPointManager: React.FC<CustomPointManagerProps> = observer(({ open }) => {
  const { adapter } = useAdapter();
  const isMobile = useIsMobile();
  const { t } = useTranslation('sidebar');
  const { isInMode } = useCustomPointMode();
  const [showListTab, setShowListTab] = useState(true);

  const isCustomPointVisible = adapter.customPointController.customPointVisible;

  return (
    <div
      className={cn(
        'top-0 left-0 h-full w-full pt-1 overflow-hidden transition-all bg-[#272727] z-2 flex flex-col',
        isMobile ? 'relative' : 'absolute z-5',
        isMobile || open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex gap-2 w-full shrink-0 px-1 mb-3 overflow-hidden">
        <Toggle
          className="w-full"
          checked={isCustomPointVisible}
          label={t('operation.custom_point.display')}
          onToggle={() => adapter.customPointController.setCustomPointVisible(!isCustomPointVisible)}
        />
      </div>

      <CustomPointManagerToolbar />

      <AnimatePresence initial={false}>
        {isInMode('isCreating') && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="overflow-hidden shrink-0"
          >
            <div className="p-2 rounded-lg border border-[#444] w-fit mt-1 ml-1 mr-1 relative">
              <div className="absolute -top-2.5 left-4 w-0 h-0 border-5 rotate-90 border-transparent border-r-[#444]" />
              <div className="text-xs text-[#aaaaaa] mb-2">{t('operation.custom_point.select_type')}</div>
              <CustomPointTypeSelector />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="shrink-0 grow-0 mx-3 my-3">
        <EndfieldSwitch
          checked={showListTab}
          onChange={setShowListTab}
          onText={t('operation.custom_point.tab.list')}
          offText={t('operation.custom_point.tab.preset')}
        />
      </div>

      <TabContent showListTab={showListTab} />
    </div>
  );
});

export interface CustomPointManagerMobileProps {
  open: boolean;
  onClose: () => void;
  dismissable?: boolean;
}

export const CustomPointManagerMobile = forwardRef<SheetRef, CustomPointManagerMobileProps>(
  ({ open, onClose, dismissable = true }, ref) => (
    <Sheet
      ref={ref}
      isOpen={open}
      onClose={onClose}
      snapPoints={snapPoints}
      initialSnap={4}
      dragVelocityThreshold={1500}
    >
      <Sheet.Container>
        <Sheet.Header className="bg-[#272727] rounded-t-md" />
        <Sheet.Content disableDrag className="text-white">
          <CustomPointManager open />
        </Sheet.Content>
      </Sheet.Container>
      {dismissable && <Sheet.Backdrop onClick={onClose} />}
    </Sheet>
  )
);
