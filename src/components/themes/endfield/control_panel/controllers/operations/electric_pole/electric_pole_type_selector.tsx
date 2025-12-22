import type { ElectricPoleDeviceKey } from '@endfieldmap/map-core';
import { ELECTRIC_POLE_DEVICE_CONFIGS, ElectricPoleKey } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/hooks/use_adapter';
import { getEntityIcon } from '@/utils/entity';
import { cn } from '@/utils/style';

const deviceKeys = Object.keys(ELECTRIC_POLE_DEVICE_CONFIGS) as ElectricPoleDeviceKey[];

const ElectricPoleTypeSelector: React.FC = observer(() => {
  const { t } = useTranslation('sidebar');
  const { dataService } = useAdapter();
  const selectedType = dataService.electricPoleDataService.creatingDeviceKey;

  const handleSelectType = (deviceKey: ElectricPoleDeviceKey) => {
    dataService.electricPoleDataService.setCreatingDeviceKey(deviceKey);
  };

  return (
    <div className="grid grid-cols-2 gap-1 w-full">
      {deviceKeys.map((key) => {
        const config = ELECTRIC_POLE_DEVICE_CONFIGS[key];
        const isSelected = selectedType === key;

        return (
          <button
            key={key}
            onClick={() => handleSelectType(key)}
            className={cn(
              'flex items-center gap-2 px-2 py-1 rounded transition-colors',
              isSelected ? 'bg-[#fdfb55] text-[#1d1d1d]' : 'bg-[#2a2a2a] text-[#cccccc] hover:bg-[#333333]'
            )}
          >
            <div className={cn('w-4 h-4 rounded-full flex items-center justify-center', isSelected ? 'bg-[#1d1d1d]' : 'bg-[#1d1d1d]')}>
              <img className="w-3.5 h-3.5 object-center block" src={getEntityIcon(ElectricPoleKey, config.iconPic)} alt={key} />
            </div>
            <span className="text-sm">
              {t(`operation.electric_pole.create.device_type.options.${key}`, { defaultValue: key })}
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default ElectricPoleTypeSelector;

