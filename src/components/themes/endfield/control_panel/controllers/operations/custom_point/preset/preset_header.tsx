import { EndfieldFormButton } from '@/components/common/endfield_components/form/button';
import { useTranslation } from 'react-i18next';

interface PresetHeaderProps {
  onCreate: () => void;
}

const PresetHeader: React.FC<PresetHeaderProps> = ({ onCreate }) => {
  const { t } = useTranslation('sidebar');

  return (
    <div className="flex items-center justify-between shrink-0">
      <div className="text-sm font-semibold flex items-center gap-1">
        <svg width="16" height="16" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="35" r="15" />
          <path d="M47 50 L50 70 L53 50 Z" />
          <circle cx="50" cy="35" r="8" fill="#272727" />
        </svg>
        <span>{t('operation.custom_point.preset.title')}</span>
      </div>
      <EndfieldFormButton onClick={onCreate} className="text-xs w-auto">
        {t('operation.custom_point.preset.create')}
      </EndfieldFormButton>
    </div>
  );
};

export default PresetHeader;
