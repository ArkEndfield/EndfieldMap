import type { DataInstance } from '@endfieldmap/map-core';
import { CustomPointDataInstance, CustomPointKey } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { useAdapter } from '@/context/adapter-context';
import { useActiveFeatureName } from '@/hooks/use-active-feature-name';

import { CustomPointSelect } from './custom-point-select';
import { EntityFooter } from './footer';
import { Guide } from './guide';
import { EntityHeader } from './header';

interface LeftContentProps {
  entity: DataInstance;
}

export const LeftContent = observer(function LeftContent({ entity }: LeftContentProps) {
  const adapter = useAdapter();
  const entityInfo = entity.entityInfo;
  const isCustomPoint = entityInfo?.category === CustomPointKey;
  const { name: displayName, categoryName } = useActiveFeatureName(entity);

  const iconUrl = entityInfo
    ? `${adapter.asset.entityImage}/${entityInfo.entityInfo.pic}.png`
    : '';

  const handleClose = () => {
    adapter.activeFeatureController.clearActiveFeature?.();
  };

  return (
    <View className="flex-1">
      <EntityHeader entity={entity} onClose={handleClose} />

      <ScrollView className="flex-1 px-3 py-2" showsVerticalScrollIndicator={false}>
        <Guide entity={entity.data} />

        {isCustomPoint && <CustomPointSelect instance={entity as CustomPointDataInstance} />}
      </ScrollView>

      <EntityFooter
        name={displayName || ''}
        pic={iconUrl}
        id={entity.id}
        categoryName={categoryName}
      />
    </View>
  );
});
