import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

import { TAB_ITEMS } from './tabs.config';

export default function TabLayout() {
  return (
    <NativeTabs>
      {TAB_ITEMS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={tab.icon.sf} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
