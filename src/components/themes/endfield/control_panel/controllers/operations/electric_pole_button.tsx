import { type EndfieldMapAdapter } from '@endfieldmap/map-core';
import { OperationButton } from './_button';
import { observer } from 'mobx-react-lite';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { ElectricPoleManager } from './electric_pole';
import { dataService } from '@/services/data';

export const ElectricPoleButton = observer(({ adapter, portalRef }: { adapter: EndfieldMapAdapter, portalRef: React.RefObject<HTMLDivElement | null> }) => {
  const [open, setOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (portalRef.current) {
      setPortalContainer(portalRef.current);
    }
  }, [portalRef]);

  const onToggle = () => {
    dataService.electricPoleDataService.stopCreateElectricPole();
    setOpen(!open);
  }

  return (
    <>
      <OperationButton title={open ? "关闭管理器" : "电线杆管理"} subtitle="ELECTRIC POLE MANAGER" onClick={onToggle} />
      {portalContainer && createPortal(<ElectricPoleManager open={open} adapter={adapter} />, portalContainer)}
    </>
  );
});
