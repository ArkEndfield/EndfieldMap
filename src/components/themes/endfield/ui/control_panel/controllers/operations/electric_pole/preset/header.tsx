import { useTranslation } from 'react-i18next';

import { EndfieldFormButton } from '@/components/common/endfield_components/form/button';
import { ElectricPoleIconPole } from '@/components/common/icons';

interface PresetHeaderProps {
  onCreate: () => void;
}

const PresetHeader: React.FC<PresetHeaderProps> = ({ onCreate }) => {
  const { t } = useTranslation(['sidebar']);

  return (
    <div className="flex items-center justify-between shrink-0">
      <div className="text-sm font-semibold flex items-center gap-1">
        <ElectricPoleIconPole />
        <span>{t('sidebar:operation.electric_pole.preset.title')}</span>
      </div>
      <EndfieldFormButton onClick={onCreate} className="text-xs w-auto">
        {t('sidebar:operation.electric_pole.preset.create')}
      </EndfieldFormButton>
    </div>
  );
};

export default PresetHeader;
