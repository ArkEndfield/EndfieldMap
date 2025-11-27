import { Sheet, type SheetRef } from 'react-modal-sheet';
import { observer } from 'mobx-react-lite';
import ElectricPolePresetPanel from './electric_pole_preset_panel';
import { cn } from '@/utils/style';
import { dataService } from '@/services/data';
import { alert } from '@/components/common/endfield_components/alert_api';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { snapPoints } from '@/const/ui';
import { forwardRef } from 'react';

export interface ElectricPoleManagerProps {
  open: boolean;
}

export const ElectricPoleManager: React.FC<ElectricPoleManagerProps> = observer(({ open }) => {
  const { adapter } = useAdapter();
  const isMobile = useIsMobile();

  const isCreating = dataService.electricPoleDataService.isCreating;
  const isConnecting = dataService.electricPoleDataService.isConnecting;
  const isDeleting = dataService.electricPoleDataService.isDeleting;
  const isDeletingConnection = dataService.electricPoleDataService.isDeletingConnection;
  const isAutoConnect = dataService.electricPoleDataService.autoConnect;
  const isZoneVisible = adapter.electricPoleController.zoneVisible;
  const isElecricPoleVisible = adapter.electricPoleController.electricPoleVisible;

  const isSelecting = adapter.mapController.selection.isSelecting;
  const checkCanOperate = () => {
    console.log(isSelecting);
    if (!isSelecting) return true;
    alert.info({
      content: <div className="text-center">正在处于批量管理状态，请先结束批量管理</div>,
    });
    return false;
  };
  const onCreate = () => {
    if (!checkCanOperate()) return;
    dataService.electricPoleDataService.toggleCreateElectricPole();
  };
  const onConnect = () => {
    if (!checkCanOperate()) return;
    dataService.electricPoleDataService.toggleConnectElectricPole();
  };
  const onRemove = () => {
    if (!checkCanOperate()) return;
    dataService.electricPoleDataService.toggleDeleteElectricPole();
  };
  const onRemoveConnection = () => {
    if (!checkCanOperate()) return;
    dataService.electricPoleDataService.toggleDeleteConnnection();
  };
  return (
    <div
      className={cn(
        'top-0 left-0 h-full w-full overflow-hidden transition-all bg-[#272727] z-2',
        isMobile ? 'relative' : 'absolute',
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
          onChange={() => dataService.electricPoleDataService.toggleZoneVisibility()}
        />
        <label htmlFor="enableZoneVisible">显示覆盖范围</label>
      </div>
      <div>
        <input
          type="checkbox"
          checked={isElecricPoleVisible}
          name="isElecricPoleVisible"
          id="enableElecricPoleVisible"
          onChange={() => dataService.electricPoleDataService.toggleVisibility()}
        />
        <label htmlFor="enableElecricPoleVisible">显示电线杆</label>
      </div>
      <ElectricPolePresetPanel />
    </div>
  );
});

export interface ElectricPoleManagerMobileProps {
  open: boolean;
  onClose: () => void;
  dismissable?: boolean;
}

export const ElectricPoleManagerMobile = forwardRef<SheetRef, ElectricPoleManagerMobileProps>(
  ({ open, onClose, dismissable = true }, ref) => (
    <Sheet
      ref={ref}
      isOpen={open}
      onClose={onClose}
      snapPoints={snapPoints}
      initialSnap={4}
      dragVelocityThreshold={1500}
    >
      <Sheet.Container>
        <Sheet.Header className="bg-[#272727]" />
        <Sheet.Content disableDrag className="text-white">
          <ElectricPoleManager open />
        </Sheet.Content>
      </Sheet.Container>
      {dismissable && <Sheet.Backdrop onClick={onClose} />}
    </Sheet>
  )
);

ElectricPoleManagerMobile.displayName = 'ElectricPoleManagerMobile';
