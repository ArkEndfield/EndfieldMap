import type Resources from '@eftypes/resources';
import { differenceArray } from '@endfieldmap/tools';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { useAdapter } from '@/hooks/use_adapter';

const modes = ['isCreating', 'isConnecting', 'isDeleting', 'isDeletingConnection'] as const;

export type ElectricMode = (typeof modes)[number];

type ElectricPoleTranslation = Resources['sidebar']['operation']['electric_pole'];

/** 递归生成嵌套对象的点分隔路径类型 */
type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${Prefix}${K}` | NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

/** 只包含有 in_mode 子键的路径 */
type ModeTipTextKeys = Extract<
  NestedKeyOf<ElectricPoleTranslation>,
  'create' | 'connect' | 'delete' | 'connect.delete'
>;

const modeTipText: Record<ElectricMode, ModeTipTextKeys> = {
  isConnecting: 'connect',
  isCreating: 'create',
  isDeleting: 'delete',
  isDeletingConnection: 'connect.delete',
};

export const useElectricMode = () => {
  const { adapter, mapDataService } = useAdapter();
  const service = mapDataService.electricPoleDataService;
  const { t } = useTranslation('sidebar');

  const getModeValue = (mode: ElectricMode): boolean => {
    switch (mode) {
      case 'isCreating':
        return service.isCreating;
      case 'isConnecting':
        return service.isConnecting;
      case 'isDeleting':
        return service.isDeleting;
      case 'isDeletingConnection':
        return service.isDeletingConnection;
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

    // 检查是否在自定义标点操作模式
    if (mapDataService.customPointDataService.isInCustomPointOperateMode) {
      alert.info({
        content: <div className="text-center">{t('operation.custom_point_operating_tip')}</div>,
      });
      return false;
    }

    return true;
  };

  const isInMode = (...args: ElectricMode[]): boolean => {
    // 使用 getModeValue 动态获取
    return args.some((mode) => getModeValue(mode));
  };

  const getCurrentMode = (): ElectricMode | null => {
    if (service.isCreating) return 'isCreating';
    if (service.isConnecting) return 'isConnecting';
    if (service.isDeleting) return 'isDeleting';
    if (service.isDeletingConnection) return 'isDeletingConnection';
    return null;
  };

  const getCurrentModeTipText = () => {
    const currentMode = getCurrentMode();
    if (currentMode) return modeTipText[currentMode];
  };

  // 保持原来的逻辑，但内部使用的是动态的 isInMode
  const isInOtherElectricPoleMode = (...args: ElectricMode[]) => {
    const otherModes = differenceArray([...modes], args);
    return isInMode(...otherModes);
  };

  const toggleMode = (mode: ElectricMode) => {
    if (!checkCanOperate()) return;

    // 这里会调用 isInMode -> getModeValue -> service.property
    // 保证了判断的是最新状态
    if (isInOtherElectricPoleMode(mode)) {
      service.stopAllOperation();
    }

    adapter.activeFeatureController.clearActiveFeature();

    switch (mode) {
      case 'isConnecting':
        service.toggleConnectElectricPole();
        break;
      case 'isCreating':
        service.toggleCreateElectricPole();
        break;
      case 'isDeleting':
        service.toggleDeleteElectricPole();
        break;
      case 'isDeletingConnection':
        service.toggleDeleteConnnection();
        break;
    }
  };

  const changeMode = (mode: ElectricMode) => {
    if (!checkCanOperate()) return;
    service.stopAllOperation();
    switch (mode) {
      case 'isConnecting':
        service.startConnectElectricPole();
        break;
      case 'isCreating':
        service.startCreateElectricPole();
        break;
      case 'isDeleting':
        service.startDeleteElectricPole();
        break;
      case 'isDeletingConnection':
        service.startDeleteConnection();
        break;
    }
  };

  const stopAllModes = () => {
    service.stopAllOperation();
  };

  return {
    states: {
      isCreating: service.isCreating,
      isConnecting: service.isConnecting,
      isDeleting: service.isDeleting,
      isDeletingConnection: service.isDeletingConnection,
    },
    getCurrentMode,
    isInOtherMode: adapter.mapController.selection.isSelecting,
    toggleMode,
    isInMode,
    isInOtherElectricPoleMode,
    stopAllModes,
    getCurrentModeTipText,
    changeMode,
  };
};
