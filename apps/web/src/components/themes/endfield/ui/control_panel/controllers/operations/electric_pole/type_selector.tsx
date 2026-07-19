import type { ElectricPoleDeviceKey } from '@endfieldmap/map-core';
import { ELECTRIC_POLE_DEVICE_CONFIGS, isElectricPoleDeviceAvailableOnMap } from '@endfieldmap/map-core';
import {
  ElectricPoleIconPipe,
  ElectricPoleIconPole,
  ElectricPoleIconRepeater,
  ElectricPoleIconZipline80,
  ElectricPoleIconZipline110,
} from '@endfieldmap/web-components';
import { OperationContainer } from '@themes/endfield/components/topbar/operation_container';
import { OperationItem, OperationItemTitle } from '@themes/endfield/components/topbar/operation_item';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';

const ElectricPoleTypeSelector: React.FC = observer(() => {
  const { t } = useTranslation('sidebar');
  const { adapter } = useAdapter();
  const selectedType = service.dataService.mapDataService.electricPoleDataService.creatingDeviceKey;
  const currentMapId = adapter.mapController.dataManager.currentMapId;
  const pipeAvailable = isElectricPoleDeviceAvailableOnMap('pipe', currentMapId);

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
        rightBorder={pipeAvailable}
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

      {pipeAvailable && (
        <OperationItem
          actions={[
            {
              key: 'pipe',
              icon: <ElectricPoleIconPipe />,
              onClick: () => handleSelectType('pipe'),
              active: selectedType === 'pipe',
            },
          ]}
        >
          <OperationItemTitle
            title={t(`operation.electric_pole.create.device_type.options.pipe`)}
            subTitle={ELECTRIC_POLE_DEVICE_CONFIGS.pipe.rangeMeters + 'M'}
          />
        </OperationItem>
      )}
    </OperationContainer>
  );
});

export default ElectricPoleTypeSelector;
