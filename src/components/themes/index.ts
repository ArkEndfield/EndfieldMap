import endfieldTheme from '@themes/endfield';
import type { ComponentType, ThemedComponent, ThemedComponentMap } from '@themes/types';

export const themes = new Map<string, ThemedComponentMap>();

export const themeNames = {
  ENDFIELD: 'endfield',
} as const;

export type ThemeNames = (typeof themeNames)[keyof typeof themeNames];

themes.set(themeNames.ENDFIELD, endfieldTheme);

export const getThemedComponents = (themeName: (typeof themeNames)[keyof typeof themeNames]) => {
  const componentMap = themes.has(themeName) ? themes.get(themeName)! : themes.get(themeNames.ENDFIELD)!;

  return {
    get<T extends ComponentType>(type: T): ThemedComponent<T> {
      return componentMap[type] as ThemedComponent<T>;
    },
  };
};
