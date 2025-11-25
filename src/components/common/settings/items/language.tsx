import { useTranslation } from 'react-i18next';
import { languageConfig } from '@/const/language';
import { cn } from '@/utils/style';
import type { LanguageLocale } from '@/@types/language';

export const LanguageSetting = () => {
  const { t, i18n } = useTranslation('settings');
  const currentLocale = i18n.language;

  const changeLanguage = (locale: LanguageLocale) => {
    i18n.changeLanguage(locale);
  };

  return (
    <div>
      <h1 className="text-lg font-bold mb-4 text-[#282828] text-center">{t('language.change_language')}</h1>
      <div className="flex flex-col gap-2 w-full py-2 px-6">
        {languageConfig.map((locale) => (
          <button
            key={locale.locale}
            className={cn(
              'flex items-center justify-start p-2 relative overflow-hidden hover:-translate-y-0.5 transition-transform duration-200 ease-in-out',
              {
                'bg-[#1D1D1D] text-[white] shadow-[0_0_0_0.1em_inset_#1D1D1D,0_0_0_0.2em_inset_#81807F] hover:shadow-[0_0_0_0.1em_inset_#1D1D1D,0_0_0_0.2em_inset_#81807F,0_0.1em_0.2em_#1D1D1D77]':
                  currentLocale === locale.locale,
                'bg-white text-[#1D1D1D] shadow-[0_0_0_0.1em_inset_#ABA7A7] hover:bg-[#1D1D1D] hover:text-white hover:shadow-[0_0_0_0.1em_inset_#1D1D1D,0_0_0_0.2em_inset_#81807F,0_0.1em_0.2em_#1D1D1D77]':
                  currentLocale !== locale.locale,
              }
            )}
            onClick={() => changeLanguage(locale.locale)}
          >
            <span className="font-medium mr-auto">{locale.displayName}</span>
            <span
              className={cn('text-xs rounded-full border px-1', {
                'border-[#dadada] text-[#dadada]': currentLocale === locale.locale,
                'border-[#ABA7A7] text-[#ABA7A7]': currentLocale !== locale.locale,
              })}
            >
              {t(`language.language_list.${locale.locale}`)}
            </span>
            <div className="w-8 flex items-center justify-center">
              {currentLocale === locale.locale && (
                <span className="text-[white]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
