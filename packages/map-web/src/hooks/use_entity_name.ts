import type { DataInstance, EntityInfoStats } from '@endfieldmap/map-core';
import { CustomPointKey, ElectricPoleKey, NoteKey } from '@endfieldmap/map-core';
import { useTranslation } from '@endfieldmap/map-service';

import { service } from '@/services';

export const useEntityName = (entity?: EntityInfoStats) => {
  const { t } = useTranslation(['common', 'sidebar', 'lang']);
  const categoryName = entity?.category
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
    } else if (entity.category === NoteKey) {
      name = t(`lang:${entity.entityDataIdKey}`, {
        defaultValue: entity.entityDataIdKey,
      });
    } else {
      name = t(`lang:${service.langHashService.getHash(entity.entityDataIdKey)}`, {
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
      name = t(`lang:${service.langHashService.getHash(entityInfo?.entityInfo.point)}`, {
        defaultValue: entityInfo?.entityInfo.point || '',
      });
    }
  }
  return {
    name,
    categoryName,
  };
};
