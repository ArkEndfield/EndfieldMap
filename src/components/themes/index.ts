import endfieldTheme from "./endfield";
import type { ThemedComponentsMap } from "./types";

export const themes = new Map<string, ThemedComponentsMap>();

export const themeNames = {
    ENDFIELD: 'endfield',
} as const;

themes.set(themeNames.ENDFIELD, endfieldTheme);

export const getThemedComponents = (themeName: typeof themeNames[keyof typeof themeNames]) => {
  if (themes.has(themeName)) {
    return themes.get(themeName)!;
  }
  return themes.get(themeNames.ENDFIELD)!;
};