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
    <div className="grid grid-cols-2 gap-1.5 w-full">
      {deviceKeys.map((key) => {
        const config = ELECTRIC_POLE_DEVICE_CONFIGS[key];
        const isSelected = selectedType === key;

        return (
          <button
            key={key}
            onClick={() => handleSelectType(key)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200',
              'border',
              isSelected
                ? 'bg-blue-500/20 border-blue-500/30 shadow-sm shadow-blue-500/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10 active:scale-95'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                isSelected ? 'bg-blue-500/20' : 'bg-white/10'
              )}
            >
              <img className="w-4 h-4 object-center block" src={getEntityIcon(ElectricPoleKey, config.iconPic)} alt={key} />
            </div>
            <span className={cn('text-[10px] font-medium', isSelected ? 'text-white' : 'text-white/60')}>
              {t(`operation.electric_pole.create.device_type.options.${key}`, { defaultValue: key })}
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default ElectricPoleTypeSelector;

