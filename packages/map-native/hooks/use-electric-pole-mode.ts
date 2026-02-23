import type { ElectricMode } from '@endfieldmap/map-service/@types/electric_pole';
import { modes } from '@endfieldmap/map-service/const/electric_pole';
import { differenceArray } from '@endfieldmap/tools';

import { alertApi } from '@/components/ui/alert/alert-api';
import { useAdapter } from '@/context/adapter';
import { service } from '@/services/map-service';

type ModeTipTextKey = 'create' | 'connect' | 'delete' | 'connect.delete';

const modeTipText: Record<ElectricMode, ModeTipTextKey> = {
  isCreating: 'create',
  isConnecting: 'connect',
  isDeleting: 'delete',
  isDeletingConnection: 'connect.delete',
};

export const useElectricPoleMode = () => {
  const adapter = useAdapter();
  const electricPoleDataService = service.dataService.mapDataService.electricPoleDataService;

  const getModeValue = (mode: ElectricMode): boolean => {
    switch (mode) {
      case 'isCreating':
        return electricPoleDataService.isCreating;
      case 'isConnecting':
        return electricPoleDataService.isConnecting;
      case 'isDeleting':
        return electricPoleDataService.isDeleting;
      case 'isDeletingConnection':
        return electricPoleDataService.isDeletingConnection;
      default:
        return false;
    }
  };

  const checkCanOperate = () => {
    if (service.dataService.mapDataService.customPointDataService.isInCustomPointOperateMode) {
      alertApi.info('请先退出自定义标点操作模式');
      return false;
    }
    return true;
  };

  const isInMode = (...args: ElectricMode[]): boolean => {
    return args.some((mode) => getModeValue(mode));
  };

  const getCurrentMode = (): ElectricMode | null => {
    if (electricPoleDataService.isCreating) return 'isCreating';
    if (electricPoleDataService.isConnecting) return 'isConnecting';
    if (electricPoleDataService.isDeleting) return 'isDeleting';
    if (electricPoleDataService.isDeletingConnection) return 'isDeletingConnection';
    return null;
  };

  const getCurrentModeTipText = (): ModeTipTextKey | undefined => {
    const currentMode = getCurrentMode();
    if (currentMode) return modeTipText[currentMode];
  };

  const isInOtherElectricPoleMode = (...args: ElectricMode[]) => {
    const otherModes = differenceArray([...modes], args);
    return isInMode(...otherModes);
  };

  const toggleMode = (mode: ElectricMode) => {
    if (!checkCanOperate()) return;
    if (isInOtherElectricPoleMode(mode)) {
      electricPoleDataService.stopAllOperation();
    }
    adapter.activeFeatureController.clearActiveFeature();
    electricPoleDataService.setModeState(mode, !getModeValue(mode));
  };

  const stopAllModes = () => {
    electricPoleDataService.stopAllOperation();
    adapter.activeFeatureController.clearActiveFeature();
  };

  return {
    getCurrentMode,
    toggleMode,
    isInMode,
    stopAllModes,
    getCurrentModeTipText,
  };
};
