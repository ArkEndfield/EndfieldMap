import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { EndfieldToggle } from '@/components/common/endfield_components/form/toggle';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { dataService } from '@/services/data';

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
  const { adapter } = useAdapter();
  const isMobile = useIsMobile();
  const hoverDebounceTime = !adapter.enableHover ? -1 : adapter.hoverDebounceTime;

  if (isMobile) {
    return null;
  }

  const setHoverTime = (time: number) => {
    dataService.setHoverTime(time);
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
