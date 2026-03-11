import type { ElectricPoleDeviceKey } from '@endfieldmap/map-core';
import { ELECTRIC_POLE_DEVICE_CONFIGS } from '@endfieldmap/map-core';
import { useTranslation } from 'react-i18next';
import { OperationContainer } from '@themes/endfield/components/topbar/operation_container';
import { OperationItem, OperationItemTitle } from '@themes/endfield/components/topbar/operation_item';
import { observer } from 'mobx-react-lite';

import {
  ElectricPoleIconPole,
  ElectricPoleIconRepeater,
  ElectricPoleIconZipline80,
  ElectricPoleIconZipline110,
} from '@endfieldmap/web-components';
import { service } from '@/services';

const ElectricPoleTypeSelector: React.FC = observer(() => {
  const { t } = useTranslation('sidebar');
  const selectedType = service.dataService.mapDataService.electricPoleDataService.creatingDeviceKey;

  const handleSelectType = (deviceKey: ElectricPoleDeviceKey) => {
    service.dataService.mapDataService.electricPoleDataService.setCreatingDeviceKey(deviceKey);
  };

  return (
    <OperationContainer>
      <OperationItem
        rightBorder
        actions={[
          {
            key: 'pole',
            icon: <ElectricPoleIconPole />,
            onClick: () => handleSelectType('pole'),
            active: selectedType === 'pole',
          },
        ]}
      >
        <OperationItemTitle
          title={t(`operation.electric_pole.create.device_type.options.pole`)}
          subTitle={ELECTRIC_POLE_DEVICE_CONFIGS.pole.rangeMeters + 'M'}
        />
      </OperationItem>

      <OperationItem
        rightBorder
        actions={[
          {
            key: 'repeater',
            icon: <ElectricPoleIconRepeater />,
            onClick: () => handleSelectType('repeater'),
            active: selectedType === 'repeater',
          },
        ]}
      >
        <OperationItemTitle
          title={t(`operation.electric_pole.create.device_type.options.repeater`)}
          subTitle={ELECTRIC_POLE_DEVICE_CONFIGS.repeater.rangeMeters + 'M'}
        />
      </OperationItem>

      <OperationItem
        actions={[
          {
            key: 'zipline_80',
            icon: <ElectricPoleIconZipline80 />,
            onClick: () => handleSelectType('zipline_80'),
            active: selectedType === 'zipline_80',
          },
          {
            key: 'zipline_110',
            icon: <ElectricPoleIconZipline110 />,
            onClick: () => handleSelectType('zipline_110'),
            active: selectedType === 'zipline_110',
          },
        ]}
      >
        <OperationItemTitle
          title={t(`operation.electric_pole.create.device_type.options.zipline`)}
          subTitle={
            ELECTRIC_POLE_DEVICE_CONFIGS.zipline_80.rangeMeters +
            '/' +
            ELECTRIC_POLE_DEVICE_CONFIGS.zipline_110.rangeMeters +
            'M'
          }
        />
      </OperationItem>
    </OperationContainer>
  );
});

export default ElectricPoleTypeSelector;
