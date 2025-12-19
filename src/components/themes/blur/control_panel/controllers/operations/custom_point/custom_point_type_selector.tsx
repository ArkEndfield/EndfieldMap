import type { CustomPointTypeId } from '@endfieldmap/map-core';
import { CustomPointKey, customPointTypes } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/hooks/use_adapter';
import { getEntityIcon } from '@/utils/entity';
import { cn } from '@/utils/style';

/**
 * 自定义标点类型选择器
 * 显示所有可用的自定义标点类型，用户可以选择要创建的类型
 */
const CustomPointTypeSelector: React.FC = observer(() => {
  const { t } = useTranslation('common');
  const { dataService } = useAdapter();
  const selectedType = dataService.customPointDataService.selectedPointType;

  const handleSelectType = (pointType: CustomPointTypeId) => {
    dataService.customPointDataService.setSelectedPointType(pointType);
  };

  return (
    <div className="grid grid-cols-4 gap-1.5 w-full">
      {customPointTypes.map((type) => {
        const isSelected = selectedType === type.id;
        return (
          <button
            key={type.id}
            onClick={() => handleSelectType(type.id)}
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
              <img
                className="w-4 h-4 object-center block"
                src={getEntityIcon(CustomPointKey, type.icon)}
                alt={type.id}
              />
            </div>
            <span className={cn('text-[10px] font-medium', isSelected ? 'text-white' : 'text-white/60')}>
              {t(`custom_point.type.${type.id}`, { defaultValue: type.id })}
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default CustomPointTypeSelector;
