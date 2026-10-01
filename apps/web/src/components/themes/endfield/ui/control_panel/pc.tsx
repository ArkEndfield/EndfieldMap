import { cn } from '@endfieldmap/tools';
import { CurrentOperatePanel } from '@themes/endfield/const/ui';
import { useEndfieldUIManager } from '@themes/endfield/hooks/ui_manager';
import { FoldButton } from '@themes/endfield/ui/control_panel/components/fold_button';
import { Panel } from '@themes/endfield/ui/control_panel/components/panel';
import { FilterAndEntityPanelPC } from '@themes/endfield/ui/control_panel/controllers/filter_and_entity_panel.pc';
import { CustomPointManager } from '@themes/endfield/ui/control_panel/controllers/operations/custom_point';
import { ElectricPoleManager } from '@themes/endfield/ui/control_panel/controllers/operations/electric_pole';
import { RouteManager } from '@themes/endfield/ui/control_panel/controllers/operations/route';
import { observer } from 'mobx-react-lite';

const PCControlPanel = observer(() => {
  const uiManager = useEndfieldUIManager();
  const currentOperatePanel = uiManager.currentOperatePanel.value;
  const isNoneCurrentPanel = currentOperatePanel === CurrentOperatePanel.NONE;
  const isOpen = uiManager.isSidePanelOpen;
  const shouldPanelOpen = (panel: CurrentOperatePanel) => {
    return isOpen && currentOperatePanel === panel;
  };

  // 只有当侧边栏打开且不是NONE状态时才显示线条
  const showDecoration = !isNoneCurrentPanel && isOpen;

  return (
    <>
      <FoldButton
        className={cn(
          'fixed top-18 left-0 transition-transform z-5',
          isNoneCurrentPanel && '-translate-x-full delay-250'
        )}
        open={isOpen}
        onToggle={() => (uiManager.operatePanelOpen.value = !isOpen)}
      />
      <div className={cn('fixed top-23 left-4 text-white z-5')}>
        <div
          className={cn(
            'relative grid',
            'before:absolute before:left-0 before:top-0 before:w-0.5 before:bg-[#eee]/20 before:transition-all before:duration-150',
            showDecoration ? 'before:h-full' : 'before:h-0'
          )}
        >
          <Panel open={shouldPanelOpen(CurrentOperatePanel.FILTER)}>
            <FilterAndEntityPanelPC />
          </Panel>
          <Panel open={shouldPanelOpen(CurrentOperatePanel.ELECTRIC_POLE)}>
            <ElectricPoleManager />
          </Panel>
          <Panel open={shouldPanelOpen(CurrentOperatePanel.CUSTOM_POINT)}>
            <CustomPointManager />
          </Panel>
          <Panel open={shouldPanelOpen(CurrentOperatePanel.ROUTE)}>
            <RouteManager />
          </Panel>
        </div>
      </div>
    </>
  );
});

export default PCControlPanel;
