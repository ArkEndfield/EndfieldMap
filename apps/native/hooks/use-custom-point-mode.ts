import { differenceArray } from '@endfieldmap/tools';

import { alertApi } from '@/components/ui/alert/alert-api';
import { useAdapter } from '@/context/adapter';
import { service } from '@/services/map-service';

const modes = ['isCreating', 'isDeleting'] as const;

export type CustomPointMode = (typeof modes)[number];

type ModeTipTextKey = 'create' | 'delete';

const modeTipText: Record<CustomPointMode, ModeTipTextKey> = {
  isCreating: 'create',
  isDeleting: 'delete',
};

export const useCustomPointMode = () => {
  const adapter = useAdapter();
  const customPointDataService = service.dataService.mapDataService.customPointDataService;

  const getModeValue = (mode: CustomPointMode): boolean => {
    switch (mode) {
      case 'isCreating':
        return customPointDataService.isCreating;
      case 'isDeleting':
        return customPointDataService.isDeleting;
      default:
        return false;
    }
  };

  const checkCanOperate = () => {
    if (service.dataService.mapDataService.electricPoleDataService.isInElectricOperateMode) {
      alertApi.info('请先退出电线杆操作模式');
      return false;
    }
    return true;
  };

  const isInMode = (...args: CustomPointMode[]): boolean => {
    return args.some((mode) => getModeValue(mode));
  };

  const getCurrentMode = (): CustomPointMode | null => {
    if (customPointDataService.isCreating) return 'isCreating';
    if (customPointDataService.isDeleting) return 'isDeleting';
    return null;
  };

  const getCurrentModeTipText = (): ModeTipTextKey | undefined => {
    const currentMode = getCurrentMode();
    if (currentMode) return modeTipText[currentMode];
  };

  const isInOtherCustomPointMode = (...args: CustomPointMode[]) => {
    const otherModes = differenceArray([...modes], args);
    return isInMode(...otherModes);
  };

  const toggleMode = (mode: CustomPointMode) => {
    if (!checkCanOperate()) return;
    if (isInOtherCustomPointMode(mode)) {
      customPointDataService.stopAllOperation();
    }
    adapter.activeFeatureController.clearActiveFeature();
    switch (mode) {
      case 'isCreating':
        customPointDataService.setCreating(!customPointDataService.isCreating);
        break;
      case 'isDeleting':
        customPointDataService.setDeleting(!customPointDataService.isDeleting);
        break;
    }
  };

  const stopAllModes = () => {
    customPointDataService.stopAllOperation();
  };

  return {
    getCurrentMode,
    toggleMode,
    isInMode,
    stopAllModes,
    getCurrentModeTipText,
  };
};
