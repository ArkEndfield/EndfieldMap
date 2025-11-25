import { OperationButton } from './_button';
import { observer } from 'mobx-react-lite';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { ElectricPoleManager } from './electric_pole';
import { dataService } from '@/services/data';
import { useTranslation } from 'react-i18next';

export const ElectricPoleButton = observer(
  ({ portalRef }: { portalRef: React.RefObject<HTMLDivElement | null> }) => {
    const [open, setOpen] = useState(false);
    const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
    const { t } = useTranslation('sidebar');

    useEffect(() => {
      if (portalRef.current) {
        setPortalContainer(portalRef.current);
      }
    }, [portalRef]);

    const onToggle = () => {
      if (dataService.electricPoleDataService.isInElectricOperateMode) {
        dataService.electricPoleDataService.stopAllOperation();
      }
      setOpen(!open);
    };

    return (
      <>
        <OperationButton
          title={open ? t('operation.close_electric_pole_manager') : t('operation.electric_pole_manager')}
          subtitle="ELECTRIC POLE MANAGER"
          onClick={onToggle}
        />
        {portalContainer && createPortal(<ElectricPoleManager open={open} />, portalContainer)}
      </>
    );
  }
);
