import { useCurrentLanguage } from '@endfieldmap/map-hooks';
import type { Language } from '@endfieldmap/tools';
import { cn } from '@endfieldmap/tools';
import { EndfieldSelect } from '@endfieldmap/web-components';
import { TranslateIcon } from '@endfieldmap/web-components';
import { useTranslation } from 'react-i18next';

import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SettingsZone } from '@/components/common/settings/components/settings_zone';
import { SETTINGS_KEYS } from '@/const/settings';
import { service } from '@/services';

export const LanguageSetting = () => {
  const { t, i18n } = useTranslation('settings');
  const currentLocale = useCurrentLanguage(service);

  const changeLanguage = (locale: Language) => {
    i18n.changeLanguage(locale);
  };

  const languageList = service.i18nService.languageList;

  const selectOptions = languageList.map((locale) => ({
    value: locale.code,
    label: locale.displayName,
    right: (active: boolean) => (
      <span
        className={cn('text-xs rounded-full border px-1', {
          'border-[#dadada] text-[#dadada]': active,
          'border-[#5f5d5d] text-[#5f5d5d]': !active,
        })}
      >
        {t(`display.language.language_list.${locale.code}`)}
      </span>
    ),
  }));

  return (
    <SettingsZone title={t('display.language.title')} icon={<TranslateIcon />}>
      <SettingItem id={SETTINGS_KEYS.DISPLAY.LANGUAGE} title={t('display.language.change_language')}>
        <EndfieldSelect<Language>
          value={currentLocale}
          options={selectOptions}
          onChange={changeLanguage}
          className="min-w-40"
        />
      </SettingItem>
    </SettingsZone>
  );
};
