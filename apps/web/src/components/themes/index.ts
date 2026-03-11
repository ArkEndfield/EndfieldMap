import type { ComponentType, ThemedComponent, ThemedComponentMap } from '@endfieldmap/map-web-theme-types';
import endfieldTheme from '@themes/endfield';

import { EmptyComponent } from '@/components/common/empty_component';

export const themes = new Map<string, ThemedComponentMap>();

export const themeNames = {
  ENDFIELD: 'endfield',
  BLUR: 'blur',
} as const;

export type ThemeNames = (typeof themeNames)[keyof typeof themeNames];

themes.set(themeNames.ENDFIELD, endfieldTheme);
themes.set(themeNames.BLUR, endfieldTheme);

export const getThemedComponents = (themeName: (typeof themeNames)[keyof typeof themeNames]) => {
  const componentMap = themes.has(themeName) ? themes.get(themeName)! : themes.get(themeNames.ENDFIELD)!;
  const endfieldThemeComponentMap = themes.get(themeNames.ENDFIELD)!;

  return {
    get<T extends ComponentType>(type: T): ThemedComponent<T> {
      return (componentMap[type] as ThemedComponent<T>) || endfieldThemeComponentMap[type] || EmptyComponent;
    },
  };
};
