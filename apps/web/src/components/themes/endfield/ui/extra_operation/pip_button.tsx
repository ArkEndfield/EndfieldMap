import { useTranslation } from 'react-i18next';
import { cn } from '@endfieldmap/tools';
import { Tooltip, ZmdRoundIconButton } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';

import { PiPIcon } from '@endfieldmap/web-components';
import uiManager from '@/services/ui_manager';

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
