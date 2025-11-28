import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { dataService } from '@/services/data';
import { customPointTypes } from '@endfieldmap/map-core/data/custom_point';
import { cn } from '@/utils/style';
import type { CustomPointIdKey } from '@endfieldmap/map-core/types';

/**
 * 自定义标点类型选择器
 * 显示所有可用的自定义标点类型，用户可以选择要创建的类型
 */
const CustomPointTypeSelector: React.FC = observer(() => {
  const { t } = useTranslation('sidebar');
  const selectedType = dataService.customPointDataService.selectedPointType;

  const handleSelectType = (pointType: CustomPointIdKey) => {
    dataService.customPointDataService.setSelectedPointType(pointType);
  };

  return (
    <div className="flex flex-col gap-1">
      {customPointTypes.map((type) => {
        const isSelected = selectedType === type.entityInfo.point;
        return (
          <button
            key={type.entityInfo.point}
            onClick={() => handleSelectType(type.entityInfo.point)}
            className={cn(
              'flex items-center gap-2 px-2 py-1 rounded transition-colors',
              isSelected ? 'bg-[#fdfb55] text-[#1d1d1d]' : 'bg-[#2a2a2a] text-[#cccccc] hover:bg-[#333333]'
            )}
          >
            <div className={cn('w-2 h-2 rounded-full shrink-0', isSelected ? 'bg-[#1d1d1d]' : 'bg-[#fdfb55]')} />
            <span className="text-sm">
              {t(`operation.custom_point.type.${type.entityInfo.point}`, { defaultValue: type.entityInfo.point })}
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default CustomPointTypeSelector;
