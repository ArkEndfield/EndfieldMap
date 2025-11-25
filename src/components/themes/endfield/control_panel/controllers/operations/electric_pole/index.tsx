import ElectricPolePresetPanel from './electric_pole_preset_panel';
import { cn } from '@/utils/style';
import { observer } from 'mobx-react-lite';
import { dataService } from '@/services/data';
import { alert } from '@/components/common/endfield_components/alert_api';
import { useAdapter } from '@/hooks/use_adapter';

export interface ElectricPoleManagerProps {
  open: boolean;
}

export const ElectricPoleManager: React.FC<ElectricPoleManagerProps> = observer(({ open }) => {
  const { adapter } = useAdapter();

  const isCreating = dataService.electricPoleDataService.isCreating;
  const isConnecting = dataService.electricPoleDataService.isConnecting;
  const isDeleting = dataService.electricPoleDataService.isDeleting;
  const isDeletingConnection = dataService.electricPoleDataService.isDeletingConnection;
  const isAutoConnect = dataService.electricPoleDataService.autoConnect;
  const isZoneVisible = adapter.electricPoleController.zoneVisible;

  const isSelecting = adapter.mapController.selection.isSelecting;
  const checkCanOperate = () => {
    if (!isSelecting) return true;
    alert.info({
      content: <div className="text-center">正在处于批量管理状态，请先结束批量管理</div>,
    });
    return false;
  };
  const onCreate = () => {
    if (!checkCanOperate) return;
    dataService.electricPoleDataService.toggleCreateElectricPole();
  };
  const onConnect = () => {
    if (!checkCanOperate) return;
    dataService.electricPoleDataService.toggleConnectElectricPole();
  };
  const onRemove = () => {
    if (!checkCanOperate) return;
    dataService.electricPoleDataService.toggleDeleteElectricPole();
  };
  const onRemoveConnection = () => {
    if (!checkCanOperate) return;
    dataService.electricPoleDataService.toggleDeleteConnnection();
  };
  return (
    <div
      className={cn(
        'absolute top-0 left-0 h-full w-full overflow-hidden transition-all bg-[#272727] z-2',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <button onClick={onCreate} disabled={isConnecting || isDeleting || isDeletingConnection}>
        {isCreating ? '停止创建' : '开始创建'}
      </button>
      <button onClick={onConnect} disabled={isCreating || isDeleting || isDeletingConnection}>
        {isConnecting ? '停止连接' : '开始连接'}
      </button>
      <button onClick={onRemove} disabled={isCreating || isConnecting || isDeletingConnection}>
        {isDeleting ? '停止删除' : '开始删除'}
      </button>
      <button onClick={onRemoveConnection} disabled={isCreating || isConnecting || isDeleting}>
        {isDeletingConnection ? '停止删除连接' : '开始删除连接'}
      </button>
      <div>
        <input
          type="checkbox"
          checked={isAutoConnect}
          name="isAutoConnect"
          id="enableAutoConnect"
          onChange={() => dataService.electricPoleDataService.toggleAutoConnect()}
        />
        <label htmlFor="enableAutoConnect">创建时自动连接</label>
      </div>
      <div>
        <input
          type="checkbox"
          checked={isZoneVisible}
          name="isZoneVisible"
          id="enableZoneVisible"
          onChange={() => adapter.electricPoleController.toggleZoneVisible()}
        />
        <label htmlFor="enableZoneVisible">显示覆盖范围</label>
      </div>
      <ElectricPolePresetPanel />
    </div>
  );
});
