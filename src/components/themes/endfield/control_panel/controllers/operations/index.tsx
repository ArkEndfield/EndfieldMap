import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import { SelectModeOperation } from './select_mode';

export const Operations = ({ adapter }: { adapter: EndfieldMapAdapter }) => {
  return (
    <div className='w-full overflow-hidden'>
      <SelectModeOperation adapter={adapter} />
    </div>
  );
};
