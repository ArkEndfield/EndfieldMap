import { SideButton } from '@themes/endfield/control_panel/controllers/mobile/side_button';
import { OperationButton } from '@themes/endfield/control_panel/controllers/operations/_button';
import { OperationTip } from '@themes/endfield/control_panel/controllers/operations/_tip';
import {
  CustomPointManager,
  CustomPointManagerMobile,
  CustomPointModeTip,
} from '@themes/endfield/control_panel/controllers/operations/custom_point';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { SheetRef } from 'react-modal-sheet';

import { alert } from '@/components/common/endfield_components/alert/alert_api';
import { useAdapter } from '@/hooks/use_adapter';
import uiManager from '@/services/ui_manager';

const CustomPointButtonIcon = ({ children }: { children: React.ReactNode }) => (
  <svg width="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_custom_point)">
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
      {/* 自定义标点图标 - 使用标记/图钉样式 */}
      <circle cx="50" cy="35" r="15" fill="currentColor" />
      <path d="M47 50 L50 70 L53 50 Z" fill="currentColor" />
      <circle cx="50" cy="35" r="8" fill="#272727" />
    </g>
    <defs>
      <clipPath id="clip0_custom_point">
        <rect width="100" height="100" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const CustomPointButtonMobile = observer(() => {
  const { t } = useTranslation('sidebar');
  const { dataService } = useAdapter();
  const [open, setOpen] = useState(false);
  const sheet = useRef<SheetRef>(null);
  const onClose = () => {
    if (dataService.customPointDataService.isInCustomPointOperateMode) {
      sheet.current?.snapTo(1);
      alert.info(t('operation.custom_point_operating_tip'));
      return;
    }
    setOpen(false);
  };
  return (
    <>
      <SideButton onClick={() => setOpen(true)} position="left" level={1}>
        <CustomPointButtonIcon>
          {open ? t('operation.close_custom_point_manager') : t('operation.custom_point_manager')}
        </CustomPointButtonIcon>
      </SideButton>
      <CustomPointManagerMobile
        ref={sheet}
        open={open}
        onClose={onClose}
        dismissable={!dataService.customPointDataService.isInCustomPointOperateMode}
      />
    </>
  );
});

export const CustomPointButton = observer(({ portalRef }: { portalRef: React.RefObject<HTMLDivElement | null> }) => {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const { t } = useTranslation('sidebar');
  const { dataService } = useAdapter();
  const open = uiManager.customPointManagerOpen;

  useEffect(() => {
    if (portalRef.current) {
      setPortalContainer(portalRef.current);
    }
  }, [portalRef]);

  const onToggle = () => {
    if (dataService.customPointDataService.isInCustomPointOperateMode) {
      dataService.customPointDataService.stopAllOperation();
    }
    uiManager.toggleCustomPointManager();
  };

  const onClose = () => {
    dataService.customPointDataService.stopAllOperation();
  };

  const isInOperateMode = dataService.customPointDataService.isInCustomPointOperateMode;

  return (
    <>
      <OperationButton
        title={open ? t('operation.close_custom_point_manager') : t('operation.custom_point_manager')}
        subtitle="CUSTOM POINT MANAGER"
        onClick={onToggle}
        active={open}
      />
      {portalContainer && createPortal(<CustomPointManager open={open} />, portalContainer)}
      <OperationTip open={isInOperateMode} onClose={onClose}>
        <CustomPointModeTip />
      </OperationTip>
    </>
  );
});
