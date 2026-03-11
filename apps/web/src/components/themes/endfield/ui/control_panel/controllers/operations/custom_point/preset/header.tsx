import { useTranslation } from 'react-i18next';
import { Tooltip, ZmdRoundIconButton } from '@endfieldmap/web-components';

import { CustomPointIcon } from '@endfieldmap/web-components';
import { PlusIcon } from '@endfieldmap/web-components';

interface PresetHeaderProps {
  onCreate: () => void;
}

const PresetHeader: React.FC<PresetHeaderProps> = ({ onCreate }) => {
  const { t } = useTranslation('sidebar');

  return (
    <div className="flex items-center justify-between shrink-0">
      <div className="text-sm font-semibold flex items-center gap-1">
        <CustomPointIcon />
        <span>{t('operation.custom_point.preset.title')}</span>
      </div>
      <Tooltip tooltip={t('operation.custom_point.preset.create')} placement="bottom">
        <ZmdRoundIconButton onClick={onCreate}>
          <PlusIcon />
        </ZmdRoundIconButton>
      </Tooltip>
    </div>
  );
};

export default PresetHeader;
