import { themeNames, type ThemeNames } from "@/components/themes";
import { UILocalStorageKey } from "@/const/storage";
import { LocalStorageDB } from "@endfieldmap/tools";
import { action, observable } from "mobx";

class UIManager {
    @observable accessor sidebarCollapsed!: boolean;
    @observable accessor settingsShown: boolean;
    @observable accessor theme!: ThemeNames;

    constructor() {
        this.settingsShown = false;
        this.restoreDataFromLocalStorage();
    }

    private getDataFromLocalStorage() {
        const sidebarCollapsed =  LocalStorageDB.get<boolean>(UILocalStorageKey.SIDEBAR_COLLAPSED) ?? true;
        const theme = LocalStorageDB.get<ThemeNames>(UILocalStorageKey.THEME) ?? themeNames.ENDFIELD;
        return {
            sidebarCollapsed,
            theme
        }
    }

    private restoreDataFromLocalStorage() {
        const data = this.getDataFromLocalStorage();
        this.setSidebarCollapsed(data.sidebarCollapsed);
        this.setTheme(data.theme);
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
}

const uiManager = new UIManager();

export default uiManager;