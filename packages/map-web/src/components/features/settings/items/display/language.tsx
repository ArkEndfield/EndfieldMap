import { useTranslation } from '@endfieldmap/map-service';
import type { Language } from '@endfieldmap/tools';

import { EndfieldSelect } from '@/components/common/endfield_components/form/select';
import { TranslateIcon } from '@/components/common/icons';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SettingsZone } from '@/components/common/settings/components/settings_zone';
import { languageConfig } from '@/const/language';
import { SETTINGS_KEYS } from '@/const/settings';
import { useCurrentLanguage } from '@/hooks/use_current_language';
import { cn } from '@/utils/style';

export const LanguageSetting = () => {
  const { t, i18n } = useTranslation('settings');
  const currentLocale = useCurrentLanguage();

  const changeLanguage = (locale: Language) => {
    i18n.changeLanguage(locale);
  };

  const selectOptions = languageConfig.map((locale) => ({
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
