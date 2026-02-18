import { observer } from 'mobx-react-lite';
import { useTranslation } from '@endfieldmap/map-service';

import { EndfieldToggle } from '@/components/common/endfield_components/form/toggle';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';

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
  const { mapDataService } = useAdapter();
  const isMobile = useIsMobile();
  const hoverDebounceTime = mapDataService.mapStateDataService.hoverTime.value;

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
        onChange={(v) => (mapDataService.mapStateDataService.hoverTime.value = v)}
      />
    </SettingItem>
  );
});
