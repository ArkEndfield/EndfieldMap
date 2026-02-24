import type { DataInstance } from '@endfieldmap/map-core';
import { CustomPointKey, ElectricPoleKey } from '@endfieldmap/map-core';
import { useTranslation } from 'react-i18next';

import { service } from '@/services/map-service';

export function useActiveFeatureName(entity?: DataInstance | null): {
  name: string;
  categoryName: string;
} {
  const { t } = useTranslation(['common', 'sidebar', 'lang']);

  let categoryName = 'unknown category';
  let name = 'unnamed';

  if (entity) {
    const entityInfo = entity.entityInfo;
    categoryName = t(`sidebar:filter.category.${entityInfo?.category}`, {
      defaultValue: entityInfo?.category,
    });

    if (entityInfo?.category === ElectricPoleKey) {
      name = entity.name;
    } else if (entityInfo?.category === CustomPointKey) {
      name = entity.name;
    } else {
      name = t(`lang:${service.langHashService.getHash(entityInfo?.entityInfo.point)}`, {
        defaultValue: entityInfo?.entityInfo.point || '',
      });
    }
  }

  return { name, categoryName };
}
