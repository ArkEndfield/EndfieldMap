import { LocalStorageDB } from '@endfieldmap/tools';
import { action, observable } from 'mobx';

import { type ThemeNames,themeNames } from '@/components/themes';
import { UILocalStorageKey } from '@/const/storage';
import { DARK_MODE } from '@/const/ui';

class UIManager {
  private mediaQueryList: MediaQueryList | null = null;

  @observable accessor sidebarCollapsed!: boolean;
  @observable accessor settingsShown: boolean;
  @observable accessor theme!: ThemeNames;
  @observable accessor electricPoleManagerOpen: boolean;
  @observable accessor customPointManagerOpen: boolean;
  @observable accessor adjustPopup!: boolean;
  @observable accessor darkMode!: DARK_MODE;

  constructor() {
    this.settingsShown = false;
    this.electricPoleManagerOpen = false;
    this.customPointManagerOpen = false;
    this.restoreDataFromLocalStorage();
  }

  private getDataFromLocalStorage() {
    const sidebarCollapsed = LocalStorageDB.get<boolean>(UILocalStorageKey.SIDEBAR_COLLAPSED) ?? true;
    const theme = LocalStorageDB.get<ThemeNames>(UILocalStorageKey.THEME) ?? themeNames.ENDFIELD;
    const adjustPopup = LocalStorageDB.get<boolean>(UILocalStorageKey.ADJUST_POPUP) ?? true;
    const darkMode = LocalStorageDB.get<DARK_MODE>(UILocalStorageKey.DARK_MODE) ?? DARK_MODE.AUTO;

    return {
      sidebarCollapsed,
      theme,
      adjustPopup,
      darkMode,
    };
  }

  private restoreDataFromLocalStorage() {
    const data = this.getDataFromLocalStorage();
    this.setSidebarCollapsed(data.sidebarCollapsed);
    this.setTheme(data.theme);
    this.setAdjustPopupOpen(data.adjustPopup);
    this.setDarkMode(data.darkMode);
  }

  // region: 主题
  @action
  setTheme(theme: ThemeNames) {
    this.theme = theme;
    LocalStorageDB.set(UILocalStorageKey.THEME, theme);
  }
  // endregion

  // region: 侧边栏
  @action
  setSidebarCollapsed(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
    LocalStorageDB.set(UILocalStorageKey.SIDEBAR_COLLAPSED, collapsed);
  }

  @action
  public toggleSidebar() {
    this.setSidebarCollapsed(!this.sidebarCollapsed);
  }
  // endregion

  // region: 设置
  @action
  public setSettingsShown(shown: boolean) {
    this.settingsShown = shown;
  }

  @action
  public toggleSettings() {
    this.settingsShown = !this.settingsShown;
  }
  // endregion

  @action
  public closeAllManagers() {
    this.setElectricPoleManagerOpen(false);
    this.setCustomPointManagerOpen(false);
  }

  @action
  public toggleAllManagers() {
    this.toggleElectricPoleManager();
    this.toggleCustomPointManager();
  }

  // region: 电线杆管理器
  @action
  public setElectricPoleManagerOpen(open: boolean) {
    if (open && this.customPointManagerOpen) {
      // 如果要打开电线杆管理器，先关闭自定义标点管理器
      this.setCustomPointManagerOpen(false);
    }
    this.electricPoleManagerOpen = open;
  }

  @action
  public toggleElectricPoleManager() {
    this.setElectricPoleManagerOpen(!this.electricPoleManagerOpen);
  }
  // endregion

  // region: 自定义标点管理器
  @action
  public setCustomPointManagerOpen(open: boolean) {
    if (open && this.electricPoleManagerOpen) {
      // 如果要打开自定义标点管理器，先关闭电线杆管理器
      this.setElectricPoleManagerOpen(false);
    }
    this.customPointManagerOpen = open;
  }

  @action
  public toggleCustomPointManager() {
    this.setCustomPointManagerOpen(!this.customPointManagerOpen);
  }
  // endregion

  // region: 调整弹出层
  @action
  public setAdjustPopupOpen(open: boolean) {
    this.adjustPopup = open;
    LocalStorageDB.set(UILocalStorageKey.ADJUST_POPUP, open);
  }

  @action
  public toggleAdjustPopup() {
    this.setAdjustPopupOpen(!this.adjustPopup);
  }
  // endregion

  // region: dark mode
  @action
  public setDarkMode(mode: DARK_MODE) {
    this.darkMode = mode;
    LocalStorageDB.set(UILocalStorageKey.DARK_MODE, mode);

    if (mode === DARK_MODE.AUTO) {
      if (!this.mediaQueryList) {
        this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      }
      this.mediaQueryList.addEventListener('change', this.handleSystemThemeChange);
      this.handleSystemThemeChange(this.mediaQueryList);
    } else {
      this.mediaQueryList?.removeEventListener('change', this.handleSystemThemeChange);
      if (mode === DARK_MODE.DARK) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
  }

  private handleSystemThemeChange = (e: MediaQueryList | MediaQueryListEvent) => {
    if (e.matches) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };
  // endregion
}

const uiManager = new UIManager();

export default uiManager;
