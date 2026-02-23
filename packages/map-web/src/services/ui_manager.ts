import type { PresetStoreTab } from '@endfieldmap/map-service';
import { LocalStorageValue } from '@endfieldmap/tools';
import { getThemedComponents, type ThemeNames, themeNames } from '@themes/index';
import { ComponentType } from '@endfieldmap/map-web-theme-types';
import { action, computed, observable } from 'mobx';

import { UILocalStorageKey } from '@/const/storage';
import { DARK_MODE } from '@/const/ui';
import { audioService } from '@endfieldmap/web-components';

class UIManager {
  private mediaQueryList: MediaQueryList | null = null;

  @observable accessor settingsShown: boolean;
  @observable accessor isDark = false;

  // region: dark mode
  @action
  private handleSystemThemeChange(e: MediaQueryList | MediaQueryListEvent) {
    if (e.matches) {
      document.body.classList.add('dark');
      this.isDark = true;
    } else {
      document.body.classList.remove('dark');
      this.isDark = false;
    }
  }

  @action
  private onDarkModeChange = (mode: DARK_MODE) => {
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
        this.isDark = true;
      } else {
        document.body.classList.remove('dark');
        this.isDark = false;
      }
    }
  };
  // endregion

  public sidebarCollapsed = new LocalStorageValue({
    initialValue: true,
    storageKey: UILocalStorageKey.SIDEBAR_COLLAPSED,
  });
  public theme = new LocalStorageValue<ThemeNames>({
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
    onValueChange: this.onDarkModeChange.bind(this),
  });
  public audioEnabled = new LocalStorageValue({
    initialValue: true,
    storageKey: UILocalStorageKey.AUDIO_ENABLED,
    onValueChange: (enabled) => {
      audioService.setEnabled(enabled);
    },
  });
  public enableTier = new LocalStorageValue({
    initialValue: true,
    storageKey: UILocalStorageKey.ENABLE_TIER,
  });

  constructor() {
    this.settingsShown = false;

    // Sync audio service with saved setting
    audioService.setEnabled(this.audioEnabled.value);
  }

  // region: 设置
  @observable accessor settingsTab: string = 'general';
  @observable accessor targetSettingItem: string | null = null;

  @action
  public setSettingsShown(shown: boolean) {
    this.settingsShown = shown;
  }

  @action
  public toggleSettings() {
    this.settingsShown = !this.settingsShown;
  }

  @action
  public navigateSettings(tab: string, item?: string) {
    this.settingsTab = tab;
    if (item) {
      this.targetSettingItem = item;
    }
    this.settingsShown = true;
  }
  // endregion

  // region: 预设商店
  @observable accessor presetStoreOpen: boolean = false;
  @observable accessor presetStoreTab: PresetStoreTab = 'electric_pole';

  @action
  public openPresetStore(tab?: PresetStoreTab) {
    if (tab) {
      this.presetStoreTab = tab;
    }
    this.presetStoreOpen = true;
  }

  @action
  public closePresetStore() {
    this.presetStoreOpen = false;
  }

  @action
  public switchPresetStoreTab(tab: PresetStoreTab) {
    this.presetStoreTab = tab;
  }
  // endregion

  // region: 调整弹出层
  @action
  public toggleAdjustPopup() {
    this.adjustPopup.value = !this.adjustPopup.value;
  }
  // endregion

  // region: 音效
  @action
  public toggleAudio() {
    this.audioEnabled.value = !this.audioEnabled.value;
  }
  // endregion

  // region: 画中画
  public requestPiP: (() => void) | null = null;
  public exitPiP: (() => void) | null = null;

  @observable accessor isPiP: boolean = false;
  @observable accessor isPiPSupported: boolean = false;

  @action
  public setPiPStatus(isPiP: boolean) {
    this.isPiP = isPiP;
  }

  @action
  public setPiPSupported(supported: boolean) {
    this.isPiPSupported = supported;
  }

  public togglePiP() {
    if (this.isPiP) {
      this.exitPiP?.();
    } else {
      this.requestPiP?.();
    }
  }
  // endregion

  // region: 主题
  @computed
  get ThemedComponents() {
    const components = getThemedComponents(this.theme.value);
    return {
      map: {
        Popup: components.get(ComponentType.POPUP),
        OperationTip: components.get(ComponentType.OPERATION_TIP),
        ZoomController: components.get(ComponentType.ZOOM_CONTROLLER),
        Menus: components.get(ComponentType.MENUS),
        ControlPanel: components.get(ComponentType.CONTROL_PANEL),
        MapIndexMenu: components.get(ComponentType.MAP_INDEX_MENU),
        TierManager: components.get(ComponentType.TIER_MANAGER),
        ExtraOperation: components.get(ComponentType.EXTRA_OPERATION),
      },
      alert: {
        Alert: components.get(ComponentType.ALERT),
        AlertFull: components.get(ComponentType.ALERT_FULL),
      },
      Input: components.get(ComponentType.INPUT),
      tooltip: {
        Tooltip: components.get(ComponentType.TOOLTIP),
      },
      RootProvider: components.get(ComponentType.ROOT_PROVIDER),
    };
  }
  // endregion
}

const uiManager = new UIManager();

export default uiManager;
