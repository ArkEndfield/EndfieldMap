import type { LanguageLocale } from '@eftypes/language';
import { useTranslation } from 'react-i18next';

import { EndfieldSelect } from '@/components/common/endfield_components/form/select';
import { TranslateIcon } from '@/components/common/icons';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SettingsZone } from '@/components/common/settings/components/settings_zone';
import { languageConfig } from '@/const/language';
import { useCurrentLanguage } from '@/hooks/use_current_language';
import { cn } from '@/utils/style';

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
        {t(`display.language.language_list.${locale.locale}`)}
      </span>
    ),
  }));

  return (
    <SettingsZone title={t('display.language.title')} icon={<TranslateIcon />}>
      <SettingItem title={t('display.language.change_language')}>
        <EndfieldSelect<LanguageLocale>
          value={currentLocale}
          options={selectOptions}
          onChange={changeLanguage}
          className="min-w-40"
        />
      </SettingItem>
    </SettingsZone>
  );
};
