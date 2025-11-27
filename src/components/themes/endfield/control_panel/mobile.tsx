import { FilterControl } from './controllers/mobile/filter_and_entity_panel';
import { ElectricPoleButtomMobile } from './controllers/operations/electric_pole_button';
import { SelectModeOperation } from './controllers/operations/select_mode';

export default function MobileControlPanel() {
  return (
    <>
      <SelectModeOperation />
      <FilterControl />
      <ElectricPoleButtomMobile />
    </>
  );
}
