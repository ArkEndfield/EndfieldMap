import type MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { SymbolViewProps } from 'expo-symbols';
import type { ComponentProps } from 'react';

type SFSymbolName = SymbolViewProps['name'];
type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export interface TabConfig {
  name: string;
  label: string;
  icon: {
    sf: { default: SFSymbolName; selected: SFSymbolName };
    md: MaterialIconName;
  };
}

export const TAB_ITEMS = [
  {
    name: 'index',
    label: '地图',
    icon: {
      sf: { default: 'map', selected: 'map.fill' },
      md: 'map',
    },
  },
  {
    name: 'preset-store',
    label: '预设商店',
    icon: {
      sf: { default: 'storefront', selected: 'storefront.fill' },
      md: 'storefront',
    },
  },
  {
    name: 'profile',
    label: '我的',
    icon: {
      sf: { default: 'person', selected: 'person.fill' },
      md: 'person',
    },
  },
] as const satisfies readonly TabConfig[];
