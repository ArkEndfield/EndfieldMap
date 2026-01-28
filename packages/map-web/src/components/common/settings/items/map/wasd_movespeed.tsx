import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { EndfieldToggle } from '@/components/common/endfield_components/form/toggle';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';

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
  const { mapDataService } = useAdapter();
  const isMobile = useIsMobile();
  const wasdMoveSpeed = mapDataService.mapStateDataService.wasdMoveSpeed.value;

  if (isMobile) {
    return null;
  }

  return (
    <SettingItem title={t('map.wasd_move_speed.title')} description={t('map.wasd_move_speed.description')} tailDeco>
      <EndfieldToggle
        className="min-w-88"
        options={options.map((option) => ({
          key: option.key,
          label: t(`map.wasd_move_speed.value.${option.label}`),
        }))}
        activeKey={wasdMoveSpeed}
        onChange={(v) => (mapDataService.mapStateDataService.wasdMoveSpeed.value = v)}
      />
    </SettingItem>
  );
});
