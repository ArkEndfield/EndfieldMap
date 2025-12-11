import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { ThemeIcon } from '@/components/common/icons';
import { SettingsZone } from '@/components/common/settings/components/settings_zone';
import { ThemeItem } from '@/components/common/settings/items/display/theme/item';
import { type ThemeNames, themeNames } from '@/components/themes';
import uiManager from '@/services/ui_manager';

export const ThemeSetting = observer(() => {
  const { t } = useTranslation('settings');
  const currentTheme = uiManager.theme.value as ThemeNames;

  const handleThemeChange = (name: ThemeNames) => {
    uiManager.theme.value = name;
  };

  return (
    <SettingsZone title={t('display.theme.title')} icon={<ThemeIcon />}>
      <div className="flex flex-wrap gap-2">
        {Object.values(themeNames).map((name) => (
          <ThemeItem key={name} name={name} active={currentTheme === name} onClick={handleThemeChange} />
        ))}
      </div>
    </SettingsZone>
  );
});
