import { OperationList } from '@themes/endfield/components/topbar/operation_list';
import { CurrentOperatePanel } from '@themes/endfield/const/ui';
import { useEndfieldUIManager } from '@themes/endfield/hooks/ui_manager';
import { RouteManagerToolbar } from '@themes/endfield/ui/control_panel/controllers/operations/route/toolbar';
import { observer } from 'mobx-react-lite';

/** 路线模式的顶栏工具条（新建/撤销/导入），仅在路线面板打开时出现。 */
export const RouteOperationTip = observer(() => {
  const uiManager = useEndfieldUIManager();
  const isOpen = uiManager.currentOperatePanel.value === CurrentOperatePanel.ROUTE;

  return (
    <OperationList open={isOpen} className="flex gap-2">
      <RouteManagerToolbar />
    </OperationList>
  );
});
