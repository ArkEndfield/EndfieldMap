import { Tabs } from 'expo-router';
import React from 'react';

import { CurvedTabBar } from '@/components/ui/tab-bar/curved-tab-bar';
import { IconSymbol } from '@/components/ui/icon';

import { TAB_ITEMS } from './tabs.config';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CurvedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', elevation: 0, borderTopWidth: 0 },
      }}
    >
      {TAB_ITEMS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color }) => <IconSymbol size={28} name={tab.icon.sf.selected} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
