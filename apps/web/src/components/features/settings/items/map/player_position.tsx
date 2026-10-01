import { EndfieldSwitch } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { service } from '@/services';
import { playerPositionStore } from '@/services/player_position_store';

export const PlayerPositionSetting = observer(() => {
  const { t } = useTranslation(['settings', 'common']);
  const isLogin = service.userService.auth.isLogin;
  const hasRole = !!service.userService.auth.currentUidInfo;

  return (
    <SettingItem
      id={SETTINGS_KEYS.GENERAL.PLAYER_POSITION}
      title={t('settings:map.player_position.title', '玩家位置同步')}
      description={
        !isLogin
          ? t('settings:map.player_position.need_login', '登录并绑定终末地角色后，可在地图上实时显示你的位置')
          : !hasRole
            ? t('settings:map.player_position.need_role', '请先绑定一个终末地角色')
            : t(
                'settings:map.player_position.description',
                '从森空岛同步你在终末地中的实时位置，在地图上以蓝色脉冲标记显示'
              )
      }
      tailDeco
    >
      <EndfieldSwitch
        checked={playerPositionStore.enabled}
        disabled={!isLogin || !hasRole}
        onChange={(v) => playerPositionStore.setEnabled(v)}
        onText={t('common:yes')}
        offText={t('common:no')}
      />
    </SettingItem>
  );
});

export const PlayerTierSetting = observer(() => {
  const { t } = useTranslation(['settings', 'common']);

  return (
    <SettingItem
      id={SETTINGS_KEYS.GENERAL.PLAYER_TIER}
      title={t('settings:map.player_position.follow_tier.title', '跟随所在分层')}
      description={t(
        'settings:map.player_position.follow_tier.description',
        '按森空岛同步的位置和高度判断你在洞穴、楼层等哪个分层，进出时自动打开对应的分层图'
      )}
      tailDeco
    >
      <EndfieldSwitch
        checked={playerPositionStore.followTier}
        disabled={!playerPositionStore.enabled}
        onChange={(v) => playerPositionStore.setFollowTier(v)}
        onText={t('common:yes')}
        offText={t('common:no')}
      />
    </SettingItem>
  );
});
