import Tooltip from '@themes/endfield/components/tooltip';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '@endfieldmap/map-service';

import { ZmdRoundIconButton } from '@/components/common/endfield_components/button/round_icon_button';
import { LayerSwitchIcon } from '@/components/common/icons';
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
