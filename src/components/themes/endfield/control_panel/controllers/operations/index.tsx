import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import { SelectModeOperation } from './select_mode';
import { ElectricPoleButton } from './electric_pole_button';

export const Operations = ({ adapter, portalRef }: { adapter: EndfieldMapAdapter, portalRef: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div className='w-full overflow-hidden'>
      <SelectModeOperation adapter={adapter} />
      <ElectricPoleButton adapter={adapter} portalRef={portalRef} />
    </div>
  );
};
