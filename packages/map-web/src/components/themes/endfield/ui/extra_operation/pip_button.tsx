import { useTranslation } from '@endfieldmap/map-service';
import { Tooltip } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';

import { ZmdRoundIconButton } from '@endfieldmap/web-components';
import { PiPIcon } from '@/components/common/icons';
import uiManager from '@/services/ui_manager';
import { cn } from '@endfieldmap/tools';

export const PiPButton = observer(() => {
  const { t } = useTranslation('settings');
  const isSupported = uiManager.isPiPSupported;
  const isPiP = uiManager.isPiP;

  if (!isSupported) {
    return null;
  }

  return (
    <Tooltip
      as={ZmdRoundIconButton}
      tooltip={isPiP ? t('map.exit_pip') : t('map.enter_pip')}
      placement="left"
      asProps={{
        onClick: () => uiManager.togglePiP(),
        className: cn(
          'w-8 h-8 text-lg md:text-base md:w-6 md:h-6',
          isPiP && 'bg-yellow-500 text-black hover:bg-yellow-400'
        ),
      }}
    >
      <PiPIcon />
    </Tooltip>
  );
});
