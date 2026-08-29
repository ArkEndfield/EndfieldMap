import { Tooltip, ZmdRoundIconButton } from '@endfieldmap/web-components';
import { LayerSwitchIcon } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/hooks/use_adapter';
import uiManager from '@/services/ui_manager';

export const EnableTier = observer(() => {
  const { t } = useTranslation(['settings']);
  const { adapter } = useAdapter();
  const toggleTierEnabled = () => {
    uiManager.enableTier.value = !uiManager.enableTier.value;
    adapter.tierController.clearTier();
  };
  return (
    <Tooltip
      as={ZmdRoundIconButton}
      tooltip={t('map.toggle_layer')}
      placement="left"
      asProps={{
        onClick: toggleTierEnabled,
        className: 'w-8 h-8 text-lg md:text-base md:w-6 md:h-6',
      }}
    >
      <LayerSwitchIcon />
    </Tooltip>
  );
});
