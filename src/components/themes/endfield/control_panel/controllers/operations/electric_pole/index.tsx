import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import ElectricPolePresetPanel from './electric_pole_preset_panel';
import { cn } from '@/utils/style';
import { observer } from 'mobx-react-lite';
import { dataService } from '@/services/data';
import { alert } from '@/components/common/endfield_components/alert_api';

export interface ElectricPoleManagerProps {
  adapter: EndfieldMapAdapter;
  open: boolean;
}

export const ElectricPoleManager: React.FC<ElectricPoleManagerProps> = observer(({ adapter, open }) => {
  const isCreating = dataService.electricPoleDataService.isCreating;
  const isConnecting = dataService.electricPoleDataService.isConnecting;
  const isSelecting = adapter.mapController.selection.isSelecting;
  const onCreate = () => {
    if (!isCreating && isSelecting) {
      alert.info({
        content: <div className="text-center">正在处于批量管理状态，请先结束批量管理</div>,
      });
      return;
    }
    dataService.electricPoleDataService.toggleCreateElectricPole();
  };
  const onConnect = () => {
    if (!isCreating && isSelecting) {
      alert.info({
        content: <div className="text-center">正在处于批量管理状态，请先结束批量管理</div>,
      });
      return;
    }
    dataService.electricPoleDataService.toggleConnectElectricPole();
  }
  return (
    <div
      className={cn(
        'absolute top-0 left-0 h-full w-full overflow-hidden transition-all bg-[#272727]',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <button onClick={onCreate} disabled={isConnecting}>{isCreating ? '停止创建' : '开始创建'}</button>
      <button onClick={onConnect} disabled={isCreating}>{isConnecting ? '停止连接' : '开始连接'}</button>
      <ElectricPolePresetPanel adapter={adapter} />
    </div>
  );
});
