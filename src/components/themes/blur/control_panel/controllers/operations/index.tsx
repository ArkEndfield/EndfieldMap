import { CustomPointButton } from '@themes/blur/control_panel/controllers/operations/custom_point_button';
import { ElectricPoleButton } from '@themes/blur/control_panel/controllers/operations/electric_pole_button';
import { SelectModeOperation } from '@themes/blur/control_panel/controllers/operations/select_mode';

export const Operations = ({ portalRef }: { portalRef: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div className="w-full overflow-hidden flex gap-2">
      <SelectModeOperation />
      <ElectricPoleButton portalRef={portalRef} />
      <CustomPointButton portalRef={portalRef} />
    </div>
  );
};
