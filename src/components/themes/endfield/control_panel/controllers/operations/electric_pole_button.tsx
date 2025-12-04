import { SideButton } from '@themes/endfield/control_panel/controllers/mobile/side_button';
import { OperationButton } from '@themes/endfield/control_panel/controllers/operations/_button';
import { OperationTip } from '@themes/endfield/control_panel/controllers/operations/_tip';
import {
  ElectricModeTip,
  ElectricPoleManager,
  ElectricPoleManagerMobile,
} from '@themes/endfield/control_panel/controllers/operations/electric_pole';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { SheetRef } from 'react-modal-sheet';

import { alert } from '@/components/common/endfield_components/alert/alert_api';
import uiManager from '@/services/ui_manager';
import { useAdapter } from '@/hooks/use_adapter';

const ElectricPoleButtonIcon = ({ children }: { children: React.ReactNode }) => (
  <svg width="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_391_33)">
      <rect width="100" height="100" fill="transparent" />
      <text
        fill="currentColor"
        xmlSpace="preserve"
        className="whitespace-pre"
        fontSize="18"
        fontWeight="900"
        letterSpacing="0em"
      >
        <tspan x="5" y="92.5271">
          {children}
        </tspan>
      </text>
      <path d="M22.2402 54.4365H40.7467V72.943H22.2402V54.4365Z" fill="currentColor" />
      <path d="M59.2533 54.4365H77.7598V72.943H59.2533V54.4365Z" fill="currentColor" />
      <path d="M43.4664 55.2661H56.3956V66.3859H43.4664V55.2661Z" fill="currentColor" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M59.2529 55.2656H40.7471V0H59.2529V55.2656ZM46.5771 5.57715V48.9287H53.6758L50.8867 5.57715H46.5771Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_391_33">
        <rect width="100" height="100" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const ElectricPoleButtomMobile = observer(() => {
  const { t } = useTranslation('sidebar');
  const { dataService } = useAdapter();
  const [open, setOpen] = useState(false);
  const sheet = useRef<SheetRef>(null);
  const onClose = () => {
    if (dataService.electricPoleDataService.isInElectricOperateMode) {
      sheet.current?.snapTo(1);
      alert.info(t('operation.electric_pole_operating_tip'));
      return;
    }
    setOpen(false);
  };
  return (
    <>
      <SideButton onClick={() => setOpen(true)} position="right">
        <ElectricPoleButtonIcon>
          {open ? t('operation.close_electric_pole_manager') : t('operation.electric_pole_manager')}
        </ElectricPoleButtonIcon>
      </SideButton>
      <ElectricPoleManagerMobile
        ref={sheet}
        open={open}
        onClose={onClose}
        dismissable={!dataService.electricPoleDataService.isInElectricOperateMode}
      />
    </>
  );
});

export const ElectricPoleButton = observer(({ portalRef }: { portalRef: React.RefObject<HTMLDivElement | null> }) => {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const { t } = useTranslation('sidebar');
  const { dataService } = useAdapter();
  const open = uiManager.electricPoleManagerOpen;

  useEffect(() => {
    if (portalRef.current) {
      setPortalContainer(portalRef.current);
    }
  }, [portalRef]);

  const onToggle = () => {
    if (dataService.electricPoleDataService.isInElectricOperateMode) {
      dataService.electricPoleDataService.stopAllOperation();
    }
    uiManager.toggleElectricPoleManager();
  };

  const onClose = () => {
    dataService.electricPoleDataService.stopAllOperation();
  };

  return (
    <>
      <OperationButton
        title={open ? t('operation.close_electric_pole_manager') : t('operation.electric_pole_manager')}
        subtitle="ELECTRIC POLE MANAGER"
        onClick={onToggle}
        active={open}
      />
      {portalContainer && createPortal(<ElectricPoleManager open={open} />, portalContainer)}
      <OperationTip open={dataService.electricPoleDataService.isInElectricOperateMode} onClose={onClose}>
        <ElectricModeTip />
      </OperationTip>
    </>
  );
});
