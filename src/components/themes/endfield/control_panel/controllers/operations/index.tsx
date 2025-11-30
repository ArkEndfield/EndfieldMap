import { CustomPointButton } from './custom_point_button';
import { ElectricPoleButton } from './electric_pole_button';
import { SelectModeOperation } from './select_mode';

export const Operations = ({ portalRef }: { portalRef: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div className="w-full overflow-hidden flex">
      <SelectModeOperation />
      <ElectricPoleButton portalRef={portalRef} />
      <CustomPointButton portalRef={portalRef} />
    </div>
  );
};
