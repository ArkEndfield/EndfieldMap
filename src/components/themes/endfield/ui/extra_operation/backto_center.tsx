import { ZmdRoundIconButton } from '@/components/common/endfield_components/button/round_icon_button';
import { useAdapter } from '@/hooks/use_adapter';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { DEFAULT_ZOOM } from '@endfieldmap/map-core';
import { getMapCenter } from '@endfieldmap/tools';
import Tooltip from '@themes/endfield/components/tooltip';
import { CenterIcon } from '@/components/common/icons';

export const BackToCenter = observer(() => {
  const { t } = useTranslation('settings');
  const { adapter } = useAdapter();
  const mapIndex = adapter.currentMapIndex;
  const moveToCenter = () => {
    const center = getMapCenter(mapIndex);
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
