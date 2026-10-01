import { logger } from '@endfieldmap/tools';
import { Tooltip, ZmdRoundIconButton } from '@endfieldmap/web-components';
import { LocationClusterIcon } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/hooks/use_adapter';
import { locatePlayerTier } from '@/hooks/use_player_tier';
import { switchMap } from '@/services/map_switch';
import { playerPositionStore } from '@/services/player_position_store';
import uiManager from '@/services/ui_manager';

/**
 * 定位到玩家实时位置。玩家在别的地图时先切换地图，再把视图居中到坐标，
 * 并切到玩家所在的分层（在地表就收起分层图）。
 * 仅当位置同步开启且玩家在线时显示，避免出现一个点不动的空按钮。
 */
export const PlayerLocateButton = observer(() => {
  const { t } = useTranslation('settings');
  const { adapter } = useAdapter();
  const position = playerPositionStore.position;

  if (!playerPositionStore.enabled || !position) {
    return null;
  }

  const locate = () => {
    const dataManager = adapter.mapController.dataManager;
    // 依赖 switchMap 内部 MobX observe 的同步回调：换图调用后 currentMapId
    // 立即可用于 xyz2crd。目标地图数据未加载（如新地图未随版本更新）时
    // xyz2crd 会抛错，这里兜住避免按钮点击直接冒泡成未处理异常。
    try {
      if (dataManager.currentMapId !== position.mapId) {
        switchMap(position.mapId);
      }
      const coordinate = dataManager.xyz2crd(
        { x: position.x, y: position.y, z: position.z },
        position.mapId
      );
      adapter.mapController.moveViewCenter(coordinate);
    } catch (error) {
      logger.debug('[PlayerLocate] coordinate transform failed', error);
      return;
    }

    if (uiManager.enableTier.value) {
      const tierController = adapter.tierController;
      const region = locatePlayerTier(tierController.tierDataManager, position);
      if (region && region.mapId === adapter.mapController.dataManager.currentMapId) {
        void tierController.showTier(region.mapId, region.tierId, region.subTierId);
      } else if (region === null) {
        tierController.clearTier();
      }
    }
  };

  return (
    <Tooltip
      as={ZmdRoundIconButton}
      tooltip={t('map.player_position.locate')}
      placement="left"
      asProps={{
        onClick: locate,
        className: 'w-8 h-8 text-lg md:text-base md:w-6 md:h-6',
      }}
    >
      <LocationClusterIcon />
    </Tooltip>
  );
});
