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
    <div className="grid grid-cols-4 gap-1 w-full">
      {customPointTypes.map((type) => {
        const isSelected = selectedType === type.id;
        return (
          <button
            key={type.id}
            onClick={() => handleSelectType(type.id)}
            className={cn(
              'flex items-center gap-2 px-2 py-1 rounded transition-colors',
              isSelected ? 'bg-[#fdfb55] text-[#1d1d1d]' : 'bg-[#2a2a2a] text-[#cccccc] hover:bg-[#333333]'
            )}
          >
            <div className="w-4 h-4 rounded-full bg-[#1d1d1d]">
              <img
                className="w-full h-full object-center block"
                src={getEntityIcon(CustomPointKey, type.icon)}
                alt={type.id}
              />
            </div>
            <span className="text-sm">
              {t(`custom_point.type.${type.id}`, { defaultValue: type.id })}
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default CustomPointTypeSelector;
