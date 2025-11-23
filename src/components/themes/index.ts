import endfieldTheme from './endfield';
import type { ThemedComponentsMap, ThemedComponent, ComponentType } from './types';

export const themes = new Map<string, ThemedComponentsMap>();

export const themeNames = {
  ENDFIELD: 'endfield',
} as const;

export type ThemeNames = (typeof themeNames)[keyof typeof themeNames];

themes.set(themeNames.ENDFIELD, endfieldTheme);

export const getThemedComponents = (themeName: (typeof themeNames)[keyof typeof themeNames]) => {
  const componentMap = themes.has(themeName) ? themes.get(themeName)! : themes.get(themeNames.ENDFIELD)!;

  return {
    get<T extends ComponentType>(type: T): ThemedComponent<T> {
      return componentMap.get(type) as ThemedComponent<T>;
    },
  };
};
