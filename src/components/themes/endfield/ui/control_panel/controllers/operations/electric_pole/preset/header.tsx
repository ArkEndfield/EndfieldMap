import { useTranslation } from 'react-i18next';

import { ElectricPoleIconPole } from '@/components/common/icons';
import { ZmdRoundIconButton } from '@/components/common/endfield_components/button/round_icon_button';
import Tooltip from '@themes/endfield/components/tooltip';
import { PlusIcon } from '@/components/common/icons';

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

      <Tooltip tooltip={t('sidebar:operation.electric_pole.preset.create')} placement="bottom">
        <ZmdRoundIconButton onClick={onCreate}>
          <PlusIcon />
        </ZmdRoundIconButton>
      </Tooltip>
    </div>
  );
};

export default PresetHeader;
