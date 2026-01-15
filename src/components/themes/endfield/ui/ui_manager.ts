import { LocalStorageValue } from '@endfieldmap/tools';
import { EndfieldThemeLocalStorageKey } from '@themes/endfield/const/storage_key';
import { CurrentOperatePanel } from '@themes/endfield/const/ui';

import type { DataService } from '@/services/data';

export class EndfieldUIManager {
  private static instance: EndfieldUIManager;
  private dataService: DataService;

  /** 当前操作面板 */
  public currentOperatePanel: LocalStorageValue<CurrentOperatePanel>;
  /** 侧边面板是否打开 */
  public operatePanelOpen: LocalStorageValue<boolean>;

  private constructor(dataService: DataService) {
    this.dataService = dataService;
    this.currentOperatePanel = new LocalStorageValue<CurrentOperatePanel>({
      initialValue: CurrentOperatePanel.FILTER,
      storageKey: EndfieldThemeLocalStorageKey.CURRENT_OPERATE_PANEL,
      onValueChange: () => {
        this.dataService.stopAllOperation();
      },
    });

    this.operatePanelOpen = new LocalStorageValue<boolean>({
      initialValue: true,
      storageKey: EndfieldThemeLocalStorageKey.OPERATE_PANEL_OPEN,
    });
  }

  /**
   * 获取单例
   * @param dataService 数据服务
   * @returns
   */
  public static getInstance(dataService: DataService): EndfieldUIManager {
    if (!EndfieldUIManager.instance) {
      EndfieldUIManager.instance = new EndfieldUIManager(dataService);
    }
    const instance = EndfieldUIManager.instance;
    instance.setDataService(dataService);
    return instance;
  }

  /**
   * 设置数据服务
   * @param dataService 数据服务
   */
  public setDataService(dataService: DataService) {
    this.dataService = dataService;
  }

  /**
   * 切换操作面板
   * @param panel 操作面板
   */
  public togglePanel(panel: CurrentOperatePanel) {
    // 如果 target 与当前一致，切换到 none
    if (this.currentOperatePanel.value === panel) {
      this.currentOperatePanel.value = CurrentOperatePanel.NONE;
    } else {
      this.currentOperatePanel.value = panel;
      this.operatePanelOpen.value = true;
    }
  }
}
