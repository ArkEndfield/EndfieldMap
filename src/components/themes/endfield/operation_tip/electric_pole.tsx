import { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useElectricMode } from '@/hooks/use_electric_mode';
import { OperationTip } from '@/components/themes/endfield/control_panel/components/operation_tip';
import { useAdapter } from '@/hooks/use_adapter';

const TipText = observer(() => {
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

export const ElectricPoleModeTip = observer(() => {
  const { dataService } = useAdapter();

  const onClose = () => {
    dataService.electricPoleDataService.stopAllOperation();
  };

  return (
    <OperationTip open={dataService.electricPoleDataService.isInElectricOperateMode} onClose={onClose}>
      <TipText />
    </OperationTip>
  );
});
