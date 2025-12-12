import { Toggle } from '@themes/blur/components/toggle';
import ElectricPolePresetPanel from '@themes/blur/control_panel/controllers/operations/electric_pole/preset_panel';
import { OperatorToggleButton } from '@themes/blur/control_panel/controllers/operations/operator_toggle_button';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'motion/react';
import { forwardRef, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, type SheetRef } from 'react-modal-sheet';

import { CloseIcon, PlusIcon } from '@/components/common/icons';
import { snapPoints } from '@/const/ui';
import { useAdapter } from '@/hooks/use_adapter';
import { type ElectricMode, useElectricMode } from '@/hooks/use_electric_mode';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { cn } from '@/utils/style';

const PoleManagerToolbar = observer(() => {
  const { changeMode, getCurrentMode, toggleMode } = useElectricMode();
  const { t } = useTranslation('sidebar');
  const currentMode = getCurrentMode();

  const tools: { key: ElectricMode; label: string; icon: React.ReactNode }[] = [
    {
      key: 'isCreating',
      label: t('operation.electric_pole.create.start'),
      icon: <PlusIcon />,
    },
    {
      key: 'isConnecting',
      label: t('operation.electric_pole.connect.start'),
      icon: <PlusIcon />,
    },
    {
      key: 'isDeleting',
      label: t('operation.electric_pole.delete.start'),
      icon: <CloseIcon />,
    },
    {
      key: 'isDeletingConnection',
      label: t('operation.electric_pole.connect.delete.start'),
      icon: <CloseIcon />,
    },
  ];

  return (
    <div className="flex gap-2 px-2 shrink-0">
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

export const ElectricModeTip = observer(() => {
  const { getCurrentModeTipText } = useElectricMode();
  const { t } = useTranslation('sidebar');
  const tipText = getCurrentModeTipText();
  const lastTipTextRef = useRef(tipText);

  if (tipText) {
    lastTipTextRef.current = tipText;
  }

  const displayText = tipText ?? lastTipTextRef.current;
  if (!displayText) return null;
  return t(`operation.electric_pole.${displayText}.in_mode`);
});

export interface ElectricPoleManagerProps {
  open: boolean;
}

export const ElectricPoleManager: React.FC<ElectricPoleManagerProps> = observer(({ open }) => {
  const { adapter, dataService } = useAdapter();
  const isMobile = useIsMobile();
  const { t } = useTranslation('sidebar');
  const { isInMode } = useElectricMode();

  const isAutoConnect = dataService.electricPoleDataService.autoConnect;
  const isZoneVisible = adapter.electricPoleController.zoneVisible;
  const isElecricPoleVisible = adapter.electricPoleController.electricPoleVisible;

  return (
    <div
      className={cn(
        'top-0 left-0 h-full w-full pt-2 overflow-hidden transition-all flex flex-col',
        isMobile ? 'relative' : 'absolute z-5',
        isMobile || open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex gap-2 w-full shrink-0 px-2 mb-3 overflow-hidden">
        <Toggle
          className="w-full"
          checked={isElecricPoleVisible}
          label={t('operation.electric_pole.display')}
          onToggle={() => dataService.electricPoleDataService.toggleVisibility()}
        />
        <AnimatePresence initial={false}>
          {isElecricPoleVisible && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '100%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="w-full overflow-hidden whitespace-nowrap"
            >
              <Toggle
                className="w-full"
                checked={isZoneVisible}
                label={t('operation.electric_pole.zone.display')}
                onToggle={() => dataService.electricPoleDataService.toggleZoneVisibility()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PoleManagerToolbar />

      <AnimatePresence initial={false}>
        {isInMode('isCreating') && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden shrink-0"
          >
            <div className="mx-2 mt-3 p-3 rounded-xl border border-white/10 bg-white/5 relative">
              <div className="absolute top-0 left-6 w-0 h-0 -translate-y-full border-[6px] border-transparent border-b-white/10" />
              <Toggle
                className="w-auto"
                checked={isAutoConnect}
                label={t('operation.electric_pole.create.auto_connect')}
                onToggle={() => dataService.electricPoleDataService.toggleAutoConnect()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ElectricPolePresetPanel />
    </div>
  );
});

export interface ElectricPoleManagerMobileProps {
  open: boolean;
  onClose: () => void;
  dismissable?: boolean;
}

export const ElectricPoleManagerMobile = forwardRef<SheetRef, ElectricPoleManagerMobileProps>(
  ({ open, onClose, dismissable = true }, ref) => (
    <Sheet
      ref={ref}
      isOpen={open}
      onClose={onClose}
      snapPoints={snapPoints}
      initialSnap={4}
      dragVelocityThreshold={1500}
    >
      <Sheet.Container
        className={cn(
          'bg-black/40 backdrop-blur-[40px] transform-gpu',
          'border-t border-white/20',
          'shadow-xl shadow-black/20'
        )}
      >
        <Sheet.Header className="bg-transparent rounded-t-3xl">
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-white/30 rounded-full" />
          </div>
        </Sheet.Header>
        <Sheet.Content disableDrag className="text-white bg-transparent">
          <ElectricPoleManager open />
        </Sheet.Content>
      </Sheet.Container>
      {dismissable && <Sheet.Backdrop onClick={onClose} />}
    </Sheet>
  )
);
