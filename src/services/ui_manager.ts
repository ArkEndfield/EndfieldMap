import { UILocalStorageKey } from "@/const/storage";
import { LocalStorageDB } from "@endfieldmap/tools";
import { action, observable } from "mobx";

class UIManager {
    @observable accessor sidebarCollapsed!: boolean;

    constructor() {
        this.restoreDataFromLocalStorage();
    }

    private getDataFromLocalStorage() {
        const sidebarCollapsed =  LocalStorageDB.get<boolean>(UILocalStorageKey.SIDEBAR_COLLAPSED) ?? true;
        return {
            sidebarCollapsed,
        }
    }

    private restoreDataFromLocalStorage() {
        const data = this.getDataFromLocalStorage();
        this.setSidebarCollapsed(data.sidebarCollapsed);
    }

    @action
    setSidebarCollapsed(collapsed: boolean) {
        this.sidebarCollapsed = collapsed;
        LocalStorageDB.set(UILocalStorageKey.SIDEBAR_COLLAPSED, collapsed);
    }

    @action
    public toggleSidebar() {
        this.setSidebarCollapsed(!this.sidebarCollapsed);
    }
}

const uiManager = new UIManager();

export default uiManager;