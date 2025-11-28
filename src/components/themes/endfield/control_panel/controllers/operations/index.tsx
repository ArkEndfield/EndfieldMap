import { SelectModeOperation } from './select_mode';
import { ElectricPoleButton } from './electric_pole_button';
import { CustomPointButton } from './custom_point_button';

export const Operations = ({ portalRef }: { portalRef: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div className="w-full overflow-hidden flex">
      <SelectModeOperation />
      <ElectricPoleButton portalRef={portalRef} />
      <CustomPointButton portalRef={portalRef} />
    </div>
  );
};
