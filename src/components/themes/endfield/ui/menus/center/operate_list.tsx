import { observer } from 'mobx-react-lite';

import { useAdapter } from '@/hooks/use_adapter';

import { OperateMenu } from '@themes/endfield/ui/menus/center/operate_menu';
import { useEndfieldUIManager } from '@themes/endfield/hooks/ui_manager';
import { CurrentOperatePanel } from '@themes/endfield/const/ui';
import { VisibleIcon, InVisibleIcon } from '@/components/common/icons';

export const OperateList = observer(() => {
  const { adapter, dataService } = useAdapter();
  const uiManager = useEndfieldUIManager();
  const currentTab = uiManager.currentOperatePanel.value;
  const isElecricPoleVisible = adapter.electricPoleController.electricPoleVisible;
  const isCustomPointVisible = adapter.customPointController.customPointVisible;

  return (
    <div className="flex items-stretch absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-1">
      <OperateMenu
        active={currentTab === CurrentOperatePanel.FILTER}
        rightBorder
        onToggle={() => {
          uiManager.togglePanel(CurrentOperatePanel.FILTER);
        }}
      >
        资源标点筛选
      </OperateMenu>
      <OperateMenu
        active={currentTab === CurrentOperatePanel.ELECTRIC_POLE}
        startIcon={
          isElecricPoleVisible ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                dataService.electricPoleDataService.toggleVisibility();
              }}
            >
              <VisibleIcon />
            </div>
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                dataService.electricPoleDataService.toggleVisibility();
              }}
            >
              <InVisibleIcon />
            </div>
          )
        }
        rightBorder
        onToggle={() => {
          uiManager.togglePanel(CurrentOperatePanel.ELECTRIC_POLE);
        }}
      >
        电线杆管理
      </OperateMenu>
      <OperateMenu
        active={currentTab === CurrentOperatePanel.CUSTOM_POINT}
        startIcon={
          isCustomPointVisible ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                dataService.customPointDataService.toggleVisibility();
              }}
            >
              <VisibleIcon />
            </div>
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                dataService.customPointDataService.toggleVisibility();
              }}
            >
              <InVisibleIcon />
            </div>
          )
        }
        onToggle={() => {
          uiManager.togglePanel(CurrentOperatePanel.CUSTOM_POINT);
        }}
      >
        自定义标点
      </OperateMenu>
    </div>
  );
});
