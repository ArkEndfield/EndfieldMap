import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import ElectricPolePresetPanel from './electric_pole_preset_panel';
import { cn } from '@/utils/style';
import { observer } from 'mobx-react-lite';
import { dataService } from '@/services/data';

export interface ElectricPoleManagerProps {
  adapter: EndfieldMapAdapter;
  open: boolean;
}

export const ElectricPoleManager: React.FC<ElectricPoleManagerProps> = observer(({ adapter, open }) => {
  const isCreating = dataService.electricPoleDataService.isCreating;
  const isSelecting = adapter.mapController.selection.isSelecting;
  const onCreate = () => {
    if (!isCreating && isSelecting) return;
    dataService.electricPoleDataService.toggleCreateElectricPole();
  };
  return (
    <div
      className={cn('absolute top-0 left-0 h-full w-full overflow-hidden transition-all bg-[#272727]', open ? 'translate-x-0' : '-translate-x-full')}
    >
      <button onClick={onCreate}>{isCreating ? '停止创建' : '开始创建'}</button>
      <ElectricPolePresetPanel adapter={adapter} />
    </div>
  );
});
