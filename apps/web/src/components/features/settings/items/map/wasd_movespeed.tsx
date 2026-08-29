import { EndfieldToggle, useIsMobile } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { service } from '@/services';

const options = [
  {
    key: 0.75,
    label: 'fast',
  },
  {
    key: 0.5,
    label: 'normal',
  },
  {
    key: 0.25,
    label: 'slow',
  },
  {
    key: 0.1,
    label: 'slower',
  },
  {
    key: 0,
    label: 'off',
  },
] as const;

export const WasdSetting = observer(() => {
  const { t } = useTranslation('settings');
  const wasdMoveSpeed = service.dataService.mapDataService.mapStateDataService.wasdMoveSpeed.value;
  const isMobile = useIsMobile();

  if (isMobile) {
    return null;
  }

  return (
    <SettingItem
      id={SETTINGS_KEYS.GENERAL.WASD}
      title={t('map.wasd_move_speed.title')}
      description={t('map.wasd_move_speed.description')}
      tailDeco
    >
      <EndfieldToggle
        className="min-w-88"
        options={options.map((option) => ({
          key: option.key,
          label: t(`map.wasd_move_speed.value.${option.label}`),
        }))}
        activeKey={wasdMoveSpeed}
        onChange={(v) => (service.dataService.mapDataService.mapStateDataService.wasdMoveSpeed.value = v)}
      />
    </SettingItem>
  );
});
