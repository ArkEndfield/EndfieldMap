import { EndfieldToggle } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import uiManager from '@/services/ui_manager';

const DARK_MODE_OPTIONS = [
  { label: 'display.layout.dark_mode.value.auto', key: 0 },
  { label: 'display.layout.dark_mode.value.light', key: 1 },
  { label: 'display.layout.dark_mode.value.dark', key: 2 },
] as const;

export const DarkModeSetting = observer(() => {
  const { t } = useTranslation('settings');
  const darkMode = uiManager.darkMode.value;

  return (
    <SettingItem id={SETTINGS_KEYS.DISPLAY.DARK_MODE} title={t('display.layout.dark_mode.title')}>
      <EndfieldToggle
        options={DARK_MODE_OPTIONS.map((option) => ({ label: t(option.label), key: option.key }))}
        activeKey={darkMode}
        onChange={(v) => (uiManager.darkMode.value = v)}
      />
    </SettingItem>
  );
});
