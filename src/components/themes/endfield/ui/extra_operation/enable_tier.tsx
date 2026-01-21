import { ZmdRoundIconButton } from '@/components/common/endfield_components/button/round_icon_button';
import { observer } from 'mobx-react-lite';
import Tooltip from '@themes/endfield/components/tooltip';
import { LayerSwitchIcon } from '@/components/common/icons';
import uiManager from '@/services/ui_manager';
import { useAdapter } from '@/hooks/use_adapter';

export const EnableTier = observer(() => {
  const { adapter } = useAdapter();
  const toggleTierEnabled = () => {
    uiManager.enableTier.value = !uiManager.enableTier.value;
    adapter.tierController.clearTier();
  };
  return (
    <Tooltip
      as={ZmdRoundIconButton}
      tooltip="开启/关闭分层"
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
