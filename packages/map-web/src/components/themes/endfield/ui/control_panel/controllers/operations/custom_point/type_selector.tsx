import type { CustomPointTypeId } from '@endfieldmap/map-core';
import { CustomPointKey, customPointTypes } from '@endfieldmap/map-core';
import { useTranslation } from '@endfieldmap/map-service';
import { OperationContainer } from '@themes/endfield/components/topbar/operation_container';
import { OperationItem, OperationItemTitle } from '@themes/endfield/components/topbar/operation_item';
import { observer } from 'mobx-react-lite';

import { service } from '@/services';
import { getEntityIcon } from '@/utils/entity';
import { cn } from '@/utils/style';

/**
 * 自定义标点类型选择器
 * 显示所有可用的自定义标点类型，用户可以选择要创建的类型
 */
const CustomPointTypeSelector: React.FC = observer(() => {
  const { t } = useTranslation(['common', 'sidebar']);
  const selectedType = service.dataService.mapDataService.customPointDataService.selectedPointType;

  const handleSelectType = (pointType: CustomPointTypeId) => {
    service.dataService.mapDataService.customPointDataService.setSelectedPointType(pointType);
  };

  return (
    <OperationContainer>
      <OperationItem
        actions={customPointTypes.map((type) => ({
          key: type.id,
          label: t(`custom_point.type.${type.id}`, { defaultValue: type.id }),
          icon: (
            <div
              className={cn(
                'w-7 h-7 border rounded-xs shrink-0',
                selectedType === type.id ? 'border-[#FCF250]' : 'border-[#1d1d1d]'
              )}
            >
              <img
                className="w-full h-full object-center block"
                src={getEntityIcon(CustomPointKey, type.icon)}
                alt={type.id}
              />
            </div>
          ),
          onClick: () => handleSelectType(type.id),
          active: selectedType === type.id,
        }))}
      >
        <OperationItemTitle title={t('sidebar:operation.custom_point.select_type')} />
      </OperationItem>
    </OperationContainer>
  );
});

export default CustomPointTypeSelector;
