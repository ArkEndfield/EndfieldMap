import { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { useCustomPointMode } from '@/hooks/use_custom_point_mode';

import { OperationTip } from '@/components/themes/endfield/control_panel/components/operation_tip';
import { useAdapter } from '@/hooks/use_adapter';

const TipText = observer(() => {
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

export const CustomPointModeTip = observer(() => {
  const { dataService } = useAdapter();
  const isInOperateMode = dataService.customPointDataService.isInCustomPointOperateMode;

  const onClose = () => {
    dataService.customPointDataService.stopAllOperation();
  };

  return (
    <OperationTip open={isInOperateMode} onClose={onClose}>
      <TipText />
    </OperationTip>
  );
});
