import { SideButton } from '@themes/endfield/ui/control_panel/controllers/mobile/side_button';
import { CustomPointManagerMobile } from '@themes/endfield/ui/control_panel/controllers/operations/custom_point';
import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SheetRef } from 'react-modal-sheet';

import { alert } from '@/components/common/alert/alert_api';
import { useAdapter } from '@/hooks/use_adapter';

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
