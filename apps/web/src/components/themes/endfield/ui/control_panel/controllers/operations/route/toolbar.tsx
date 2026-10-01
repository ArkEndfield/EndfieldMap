import { EditAddIcon, EditDeleteIcon, ImportIcon } from '@endfieldmap/web-components';
import { OperationContainer } from '@themes/endfield/components/topbar/operation_container';
import { OperationItem } from '@themes/endfield/components/topbar/operation_item';
import { RouteImportDialog } from '@themes/endfield/ui/control_panel/controllers/operations/route/skland_import';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { service } from '@/services';

/**
 * 路线管理工具条：新建（描点）/ 撤销 / 从森空岛导入。
 * 保存入口在面板的草稿区，显示与隐藏由 OperateList 的眼睛图标和面板内开关负责。
 */
export const RouteManagerToolbar = observer(() => {
  const { t } = useTranslation('sidebar');
  const routeService = service.dataService.mapDataService.routeDataService;
  const [importOpen, setImportOpen] = useState(false);

  const isPicking = routeService.isPicking;

  return (
    <OperationContainer className="flex gap-2">
      <OperationItem
        actions={[
          {
            key: 'picking',
            label: isPicking ? t('operation.route.pick.in_mode') : t('operation.route.pick.start'),
            icon: <EditAddIcon />,
            active: isPicking,
            onClick: () => (isPicking ? routeService.cancelPicking() : routeService.startPicking()),
          },
          {
            key: 'undo',
            label: t('operation.route.undo'),
            icon: <EditDeleteIcon />,
            active: false,
            onClick: () => routeService.undoLastPoint(),
          },
          {
            key: 'import',
            label: t('operation.route.import.title'),
            icon: <ImportIcon />,
            active: false,
            onClick: () => setImportOpen(true),
          },
        ]}
        classNames={{ actions: 'gap-4 pl-2' }}
      />
      <RouteImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </OperationContainer>
  );
});
