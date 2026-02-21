import { DEFAULT_ZOOM } from '@endfieldmap/map-core';
import { useTranslation } from '@endfieldmap/map-service';
import Tooltip from '@themes/endfield/components/tooltip';
import { observer } from 'mobx-react-lite';

import { ZmdRoundIconButton } from '@/components/common/endfield_components/button/round_icon_button';
import { CenterIcon } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';

export const BackToCenter = observer(() => {
  const { t } = useTranslation('settings');
  const { adapter } = useAdapter();
  const mapId = adapter.mapController.dataManager.currentMapId;
  const moveToCenter = () => {
    const center = adapter.mapController.dataManager.getMapCenter(mapId);
    adapter.mapController.moveViewCenter(center, DEFAULT_ZOOM);
  };
  return (
    <Tooltip
      as={ZmdRoundIconButton}
      tooltip={t('map.move_center')}
      placement="left"
      asProps={{
        onClick: moveToCenter,
        className: 'w-8 h-8 text-lg md:text-base md:w-6 md:h-6',
      }}
    >
      <CenterIcon />
    </Tooltip>
  );
});
