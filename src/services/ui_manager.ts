import { LocalStorageValue } from '@endfieldmap/tools';
import { action, observable } from 'mobx';

import { themeNames } from '@/components/themes';
import { UILocalStorageKey } from '@/const/storage';
import { DARK_MODE } from '@/const/ui';

const handleSystemThemeChange = (e: MediaQueryList | MediaQueryListEvent) => {
  if (e.matches) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
};

class UIManager {
  private mediaQueryList: MediaQueryList | null = null;

  @observable accessor settingsShown: boolean;
  @observable accessor electricPoleManagerOpen: boolean;
  @observable accessor customPointManagerOpen: boolean;

  public sidebarCollapsed = new LocalStorageValue({
    initialValue: true,
    storageKey: UILocalStorageKey.SIDEBAR_COLLAPSED,
  });
  public theme = new LocalStorageValue({
    initialValue: themeNames.ENDFIELD,
    storageKey: UILocalStorageKey.THEME,
  });
  public adjustPopup = new LocalStorageValue({
    initialValue: true,
    storageKey: UILocalStorageKey.ADJUST_POPUP,
  });
  public swiperOpen = new LocalStorageValue({
    initialValue: true,
    storageKey: UILocalStorageKey.SWIPER_OPEN,
  });
  public darkMode = new LocalStorageValue({
    initialValue: DARK_MODE.AUTO,
    storageKey: UILocalStorageKey.DARK_MODE,
    onValueChange: (mode) => {
      if (mode === DARK_MODE.AUTO) {
        if (!this.mediaQueryList) {
          this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        }
        this.mediaQueryList.addEventListener('change', handleSystemThemeChange);
        handleSystemThemeChange(this.mediaQueryList);
      } else {
        this.mediaQueryList?.removeEventListener('change', handleSystemThemeChange);
        if (mode === DARK_MODE.DARK) {
          document.body.classList.add('dark');
        } else {
          document.body.classList.remove('dark');
        }
      }
    },
  });

  constructor() {
    this.settingsShown = false;
    this.electricPoleManagerOpen = false;
    this.customPointManagerOpen = false;
  }

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
  public toggleAdjustPopup() {
    this.adjustPopup.value = !this.adjustPopup.value;
  }
  // endregion
}

const uiManager = new UIManager();

export default uiManager;
