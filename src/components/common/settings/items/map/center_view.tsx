import { useTranslation } from 'react-i18next';
import { SettingItem } from '../../components/setting_item';
import { useAdapter } from '@/hooks/use_adapter';
import { observer } from 'mobx-react-lite';
import { getMapCenter } from '@endfieldmap/tools';
import { EndfieldFormButton } from '@/components/common/endfield_components/form/button';
import { DEFAULT_ZOOM } from '@endfieldmap/map-core';

export const CenterViewSettings = observer(() => {
  const { t } = useTranslation('settings');
  const { adapter } = useAdapter();
  const mapIndex = adapter.currentMapIndex;
  const moveToCenter = () => {
    const center = getMapCenter(mapIndex);
    adapter.mapController.moveViewCenter(center, DEFAULT_ZOOM);
  };
  return (
    <SettingItem title={t('map.move_center')} tailDeco>
      <EndfieldFormButton onClick={moveToCenter}>{t('map.move_center')}</EndfieldFormButton>
    </SettingItem>
  );
});
