import { CurrentOperatePanel } from '@themes/endfield/const/ui';
import { useEndfieldUIManager } from '@themes/endfield/hooks/ui_manager';
import { FilterAndEntityPanelMobile } from '@themes/endfield/ui/control_panel/controllers/filter_and_entity_panel.mobile';
import { CustomPointManager } from '@themes/endfield/ui/control_panel/controllers/operations/custom_point';
import { ElectricPoleManager } from '@themes/endfield/ui/control_panel/controllers/operations/electric_pole';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { alert } from '@/components/common/alert/alert_api';
import { Logo } from '@/components/common/icons';
import { BottomSheet } from '@/components/themes/endfield/components/bottom_sheet';
import { useAdapter } from '@/hooks/use_adapter';

const MobileControlPanel = observer(() => {
  const { t } = useTranslation('sidebar');
  const uiManager = useEndfieldUIManager();
  const { mapDataService } = useAdapter();
  const currentPanel = uiManager.currentOperatePanel.value;
  const isOpen = uiManager.isSidePanelOpen; // Controls collapsed state
  const isNoneCurrentPanel = currentPanel === CurrentOperatePanel.NONE;

  // Toggle collapse state (like PC's FoldButton)
  const toggleCollapse = () => {
    uiManager.operatePanelOpen.value = !isOpen;
  };

  const handleToggleElectricPole = () => {
    if (mapDataService.electricPoleDataService.isInElectricOperateMode) {
      alert.info(t('operation.electric_pole_operating_tip'));
      return;
    }
    toggleCollapse();
  };

  const handleToggleCustomPoint = () => {
    if (mapDataService.customPointDataService.isInCustomPointOperateMode) {
      alert.info(t('operation.custom_point_operating_tip'));
      return;
    }
    toggleCollapse();
  };

  const logo = <Logo className="fixed h-5 bottom-2 left-1/2 -translate-x-1/2 text-white/20 z-20" />;
  if (isNoneCurrentPanel) return logo;

  return (
    <>
      {logo}
      <BottomSheet
        open={currentPanel === CurrentOperatePanel.FILTER}
        collapsed={!isOpen}
        onToggleCollapse={toggleCollapse}
      >
        <FilterAndEntityPanelMobile />
      </BottomSheet>

      <BottomSheet
        open={currentPanel === CurrentOperatePanel.ELECTRIC_POLE}
        collapsed={!isOpen}
        onToggleCollapse={handleToggleElectricPole}
        dismissible={!mapDataService.electricPoleDataService.isInElectricOperateMode}
      >
        <ElectricPoleManager />
      </BottomSheet>

      <BottomSheet
        open={currentPanel === CurrentOperatePanel.CUSTOM_POINT}
        collapsed={!isOpen}
        onToggleCollapse={handleToggleCustomPoint}
        dismissible={!mapDataService.customPointDataService.isInCustomPointOperateMode}
      >
        <CustomPointManager />
      </BottomSheet>
    </>
  );
});

export default MobileControlPanel;
