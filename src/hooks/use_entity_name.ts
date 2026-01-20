import type { DataInstance, EntityInfoStats } from '@endfieldmap/map-core';
import { useTranslation } from 'react-i18next';
import { ElectricPoleKey, CustomPointKey } from '@endfieldmap/map-core';
import { useAdapter } from '@/hooks/use_adapter';

export const useEntityName = (entity?: EntityInfoStats) => {
  const { t } = useTranslation(['common', 'sidebar', 'lang']);
  const { dataService } = useAdapter();
  const categoryName = !!entity?.category
    ? t(`sidebar:filter.category.${entity.category}`, {
        defaultValue: entity.category,
      })
    : 'unknown category';
  let name = 'unnamed';
  if (entity) {
    if (entity.category === ElectricPoleKey) {
      name = t(`sidebar:operation.electric_pole.create.device_type.options.${entity.entityDataIdKey}`, {
        defaultValue: entity.entityDataIdKey,
      });
    } else if (entity.category === CustomPointKey) {
      name = t(`common:custom_point.type.${entity.entityDataIdKey}`, {
        defaultValue: entity.entityDataIdKey,
      });
    } else {
      name = t(`lang:${dataService.langHashDataService.getHash(entity.entityDataIdKey)}`, {
        defaultValue: entity.entityDataIdKey,
      });
    }
  }
  return {
    name,
    categoryName,
  };
};

export const useActiveFeatureName = (entity?: DataInstance | null) => {
  const { t } = useTranslation(['common', 'sidebar', 'lang']);
  const { dataService } = useAdapter();
  let categoryName = 'unknown category';
  let name = 'unnamed';
  if (entity) {
    const entityInfo = entity?.entityInfo;
    categoryName = t(`sidebar:filter.category.${entityInfo?.category}`, {
      defaultValue: entityInfo?.category,
    });
    if (entityInfo?.category === ElectricPoleKey) {
      name = entity.name;
    } else if (entityInfo.category === CustomPointKey) {
      name = entity.name;
    } else {
      name = t(`lang:${dataService.langHashDataService.getHash(entityInfo?.entityInfo.point)}`, {
        defaultValue: entityInfo?.entityInfo.point || '',
      });
    }
  }
  return {
    name,
    categoryName,
  };
};
