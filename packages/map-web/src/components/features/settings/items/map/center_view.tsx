import { DEFAULT_ZOOM } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '@endfieldmap/map-service';

import { EndfieldFormButton } from '@/components/common/endfield_components/form/button';
import { SettingItem } from '@/components/common/settings/components/setting_item';
import { SETTINGS_KEYS } from '@/const/settings';
import { useAdapter } from '@/hooks/use_adapter';

export const CenterViewSetting = observer(() => {
  const { t } = useTranslation('settings');
  const { adapter } = useAdapter();
  const mapId = adapter.mapController.dataManager.currentMapId;
  const moveToCenter = () => {
    const center = adapter.mapController.dataManager.getMapCenter(mapId);
    adapter.mapController.moveViewCenter(center, DEFAULT_ZOOM);
  };
  return (
    <SettingItem id={SETTINGS_KEYS.GENERAL.CENTER_VIEW} title={t('map.move_center')} tailDeco>
      <EndfieldFormButton onClick={moveToCenter}>{t('map.move_center')}</EndfieldFormButton>
    </SettingItem>
  );
});
