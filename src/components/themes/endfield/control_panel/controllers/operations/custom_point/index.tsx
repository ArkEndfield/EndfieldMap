import { Sheet, type SheetRef } from 'react-modal-sheet';
import { observer } from 'mobx-react-lite';
import CustomPointPresetPanel from './custom_point_preset_panel';
import { cn } from '@/utils/style';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { snapPoints } from '@/const/ui';
import { forwardRef, useRef } from 'react';
import { useCustomPointMode, type CustomPointMode } from '@/hooks/use_custom_point_mode';
import { useTranslation } from 'react-i18next';
import { CustomPointButton } from './components/button';
import { CloseIcon, PlusIcon } from '@/components/common/icons';
import { Toggle } from '../electric_pole/components/toggle';

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
        <CustomPointButton
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

export interface CustomPointManagerProps {
  open: boolean;
}

export const CustomPointManager: React.FC<CustomPointManagerProps> = observer(({ open }) => {
  const { adapter } = useAdapter();
  const isMobile = useIsMobile();
  const { t } = useTranslation('sidebar');

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

      <CustomPointPresetPanel />
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
