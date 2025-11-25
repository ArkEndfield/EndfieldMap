import { SelectModeOperation } from './select_mode';
import { ElectricPoleButton } from './electric_pole_button';

export const Operations = ({ portalRef }: { portalRef: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div className='w-full overflow-hidden'>
      <SelectModeOperation />
      <ElectricPoleButton portalRef={portalRef} />
    </div>
  );
};
