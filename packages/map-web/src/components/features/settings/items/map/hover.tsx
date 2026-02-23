import { useTranslation } from '@endfieldmap/map-service';
import { observer } from 'mobx-react-lite';

import { EndfieldToggle, useIsMobile } from '@endfieldmap/web-components';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { service } from '@/services';

const options = [
  {
    key: 0,
    label: 'normal',
  },
  {
    key: 16,
    label: 'slow',
  },
  {
    key: 50,
    label: 'slower',
  },
  {
    key: 100,
    label: 'slowest',
  },
  {
    key: -1,
    label: 'off',
  },
] as const;

export const HoverSetting = observer(() => {
  const { t } = useTranslation('settings');
  const isMobile = useIsMobile();
  const hoverDebounceTime = service.dataService.mapDataService.mapStateDataService.hoverTime.value;

  if (isMobile) {
    return null;
  }

  return (
    <SettingItem
      id={SETTINGS_KEYS.GENERAL.HOVER}
      title={t('map.hover.title')}
      description={t('map.hover.description')}
      tailDeco
    >
      <EndfieldToggle
        className="min-w-88"
        options={options.map((option) => ({
          key: option.key,
          label: t(`map.hover.value.${option.label}`),
        }))}
        activeKey={hoverDebounceTime}
        onChange={(v) => (service.dataService.mapDataService.mapStateDataService.hoverTime.value = v)}
      />
    </SettingItem>
  );
});
