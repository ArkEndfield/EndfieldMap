import { useTranslation } from 'react-i18next';
import { SettingItem } from '../../components/setting_item';
import { useAdapter } from '@/hooks/use_adapter';
import { observer } from 'mobx-react-lite';
import { EndfieldToggle } from '@/components/common/endfield_components/form/toggle';
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

export const HoverSettings = observer(() => {
  const { t } = useTranslation('settings');
  const { adapter } = useAdapter();
  const isMobile = useIsMobile();
  const hoverDebounceTime = adapter.mapController.hoverFeatureController.disabled
    ? -1
    : adapter.mapController.hoverFeatureController.debounceTime;

  if (isMobile) {
    return null;
  }

  const setHoverTime = (time: number) => {
    if (time === -1) {
      adapter.mapController.hoverFeatureController.setEnable(false);
      adapter.mapController.hoverFeatureController.setDebounceTime(0);
      return;
    }
    if (adapter.mapController.hoverFeatureController.disabled) {
      adapter.mapController.hoverFeatureController.setEnable(true);
    }
    adapter.mapController.hoverFeatureController.setDebounceTime(time);
  };

  return (
    <SettingItem title={t('map.hover.title')} description={t('map.hover.description')} tailDeco>
      <EndfieldToggle
        className="min-w-88"
        options={options.map((option) => ({
          key: option.key,
          label: t(`map.hover.value.${option.label}`),
        }))}
        activeKey={hoverDebounceTime}
        onChange={setHoverTime}
      />
    </SettingItem>
  );
});
