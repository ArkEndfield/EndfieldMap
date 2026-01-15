import { CustomPointButtonMobile } from '@themes/endfield/ui/control_panel/controllers/operations/custom_point_button';
import { ElectricPoleButtomMobile } from '@themes/endfield/ui/control_panel/controllers/operations/electric_pole_button';
import { SelectModeOperation } from '@themes/endfield/ui/control_panel/controllers/operations/select_mode';

import { FilterAndEntityPanelMobile } from '@themes/endfield/ui/control_panel/controllers/filter_and_entity_panel.mobile';

export default function MobileControlPanel() {
  return (
    <>
      <ElectricPoleButtomMobile />
      <CustomPointButtonMobile />
      <FilterAndEntityPanelMobile />
      <SelectModeOperation />
    </>
  );
}
