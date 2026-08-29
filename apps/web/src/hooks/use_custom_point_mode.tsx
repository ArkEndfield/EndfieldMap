import type { Resources } from '@endfieldmap/map-service';
import { differenceArray } from '@endfieldmap/tools';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';

const modes = ['isCreating', 'isDeleting'] as const;

export type CustomPointMode = (typeof modes)[number];

type CustomPointTranslation = Resources['sidebar']['operation']['custom_point'];

/** 递归生成嵌套对象的点分隔路径类型 */
type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${Prefix}${K}` | NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

/** 只包含有 in_mode 子键的路径 */
type ModeTipTextKeys = Extract<NestedKeyOf<CustomPointTranslation>, 'create' | 'delete'>;

const modeTipText: Record<CustomPointMode, ModeTipTextKeys> = {
  isCreating: 'create',
  isDeleting: 'delete',
};

export const useCustomPointMode = () => {
  const { adapter } = useAdapter();
  const customPointDataService = service.dataService.mapDataService.customPointDataService;
  const { t } = useTranslation('sidebar');

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
    // 检查是否在选择模式
    if (adapter.mapController.selection.isSelecting) {
      alert.info({
        content: <div className="text-center">{t('operation.selecting_operating_tip')}</div>,
      });
      return false;
    }

    // 检查是否在电线杆操作模式
    if (service.dataService.mapDataService.electricPoleDataService.isInElectricOperateMode) {
      alert.info({
        content: <div className="text-center">{t('operation.electric_pole_operating_tip')}</div>,
      });
      return false;
    }

    return true;
  };

  const isInMode = (...args: CustomPointMode[]): boolean => {
    // 使用 getModeValue 动态获取
    return args.some((mode) => getModeValue(mode));
  };

  const getCurrentMode = (): CustomPointMode | null => {
    if (customPointDataService.isCreating) return 'isCreating';
    if (customPointDataService.isDeleting) return 'isDeleting';
    return null;
  };

  const getCurrentModeTipText = () => {
    const currentMode = getCurrentMode();
    if (currentMode) return modeTipText[currentMode];
  };

  const isInOtherCustomPointMode = (...args: CustomPointMode[]) => {
    const otherModes = differenceArray([...modes], args);
    return isInMode(...otherModes);
  };

  const stopAllModes = () => {
    customPointDataService.setCreating(false);
    customPointDataService.setDeleting(false);
  };

  const toggleMode = (mode: CustomPointMode) => {
    if (!checkCanOperate()) return;

    // 这里会调用 isInMode -> getModeValue -> service.property
    // 保证了判断的是最新状态
    if (isInOtherCustomPointMode(mode)) {
      stopAllModes();
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

  const changeMode = (mode: CustomPointMode) => {
    if (!checkCanOperate()) return;
    customPointDataService.setCreating(false);
    customPointDataService.setDeleting(false);
    switch (mode) {
      case 'isCreating':
        customPointDataService.setCreating(true);
        break;
      case 'isDeleting':
        customPointDataService.setDeleting(true);
        break;
    }
  };

  return {
    states: {
      isCreating: customPointDataService.isCreating,
      isDeleting: customPointDataService.isDeleting,
    },
    getCurrentMode,
    isInOtherMode: adapter.mapController.selection.isSelecting,
    toggleMode,
    isInMode,
    isInOtherCustomPointMode,
    stopAllModes,
    getCurrentModeTipText,
    changeMode,
  };
};
