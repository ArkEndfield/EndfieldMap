import { FilterControl } from '@themes/endfield/control_panel/controllers/mobile/filter_and_entity_panel';
import { CustomPointButtonMobile } from '@themes/endfield/control_panel/controllers/operations/custom_point_button';
import { ElectricPoleButtomMobile } from '@themes/endfield/control_panel/controllers/operations/electric_pole_button';
import { SelectModeOperation } from '@themes/endfield/control_panel/controllers/operations/select_mode';

export default function MobileControlPanel() {
  return (
    <>
      <ElectricPoleButtomMobile />
      <CustomPointButtonMobile />
      <FilterControl />
      <SelectModeOperation />
    </>
  );
}
