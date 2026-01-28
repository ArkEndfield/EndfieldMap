import { LocalStorageValue } from '@endfieldmap/tools';
import { EndfieldThemeLocalStorageKey } from '@themes/endfield/const/storage_key';
import { CurrentOperatePanel } from '@themes/endfield/const/ui';
import { computed } from 'mobx';

import type { MapDataService } from '@/services/data/map';

export class EndfieldUIManager {
  private static instance: EndfieldUIManager;
  private mapDataService: MapDataService;

  /** 当前操作面板 */
  public currentOperatePanel: LocalStorageValue<CurrentOperatePanel>;
  /** 侧边面板是否打开 */
  public operatePanelOpen: LocalStorageValue<boolean>;

  private constructor(mapDataService: MapDataService) {
    this.mapDataService = mapDataService;
    this.currentOperatePanel = new LocalStorageValue<CurrentOperatePanel>({
      initialValue: CurrentOperatePanel.FILTER,
      storageKey: EndfieldThemeLocalStorageKey.CURRENT_OPERATE_PANEL,
      onValueChange: () => {
        this.mapDataService.stopAllOperation();
      },
    });

    this.operatePanelOpen = new LocalStorageValue<boolean>({
      initialValue: true,
      storageKey: EndfieldThemeLocalStorageKey.OPERATE_PANEL_OPEN,
    });
  }

  /**
   * 侧边栏是否打开
   */
  @computed
  get isSidePanelOpen(): boolean {
    return this.operatePanelOpen.value && this.isNonEmptyPanel;
  }

  /**
   * 是否为非空面板
   */
  @computed
  get isNonEmptyPanel(): boolean {
    return this.currentOperatePanel.value !== CurrentOperatePanel.NONE;
  }

  /**
   * 获取单例
   * @param mapDataService 数据服务
   * @returns
   */
  public static getInstance(mapDataService: MapDataService): EndfieldUIManager {
    if (!EndfieldUIManager.instance) {
      EndfieldUIManager.instance = new EndfieldUIManager(mapDataService);
    }
    const instance = EndfieldUIManager.instance;
    instance.setMapDataService(mapDataService);
    return instance;
  }

  /**
   * 设置数据服务
   * @param mapDataService 数据服务
   */
  public setMapDataService(mapDataService: MapDataService) {
    this.mapDataService = mapDataService;
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
