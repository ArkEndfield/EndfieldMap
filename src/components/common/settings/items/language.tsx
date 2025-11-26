import { useTranslation } from 'react-i18next';
import { languageConfig } from '@/const/language';
import type { LanguageLocale } from '@/@types/language';
import { SettingsZone } from '../components/settings_zone';
import { SettingItem } from '../components/setting_item';
import { EndfieldSelect } from '@/components/common/endfield_components/form/select';
import { cn } from '@/utils/style';
import { useCurrentLanguage } from '@/hooks/use_current_language';

export const LanguageSetting = () => {
  const { t, i18n } = useTranslation('settings');
  const currentLocale = useCurrentLanguage();

  const changeLanguage = (locale: LanguageLocale) => {
    i18n.changeLanguage(locale);
  };

  const selectOptions = languageConfig.map((locale) => ({
    value: locale.locale,
    label: locale.displayName,
    right: (active: boolean) => (
      <span
        className={cn('text-xs rounded-full border px-1', {
          'border-[#dadada] text-[#dadada]': active,
          'border-[#5f5d5d] text-[#5f5d5d]': !active,
        })}
      >
        {t(`language.language_list.${locale.locale}`)}
      </span>
    ),
  }));

  return (
    <SettingsZone title={t('language.title')}>
      <SettingItem title={t('language.change_language')}>
        <EndfieldSelect<LanguageLocale>
          value={currentLocale}
          options={selectOptions}
          onChange={changeLanguage}
          className="min-w-64"
        />
      </SettingItem>
    </SettingsZone>
  );
};
