import { useTranslation } from 'react-i18next';
import { CurrentOperatePanel } from '@themes/endfield/const/ui';
import { useEndfieldUIManager } from '@themes/endfield/hooks/ui_manager';
import { OperateMenu } from '@themes/endfield/ui/menus/center/operate_menu';
import { observer } from 'mobx-react-lite';
import { menus } from '@themes/endfield/ui/menus/left/list';

import {
  CustomPointIcon,
  ElectricPoleIconPole,
  FilterIcon,
  InVisibleIcon,
  VisibleIcon,
} from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { MenuContainer } from '@themes/endfield/ui/menus/center/menu_container';
import { SoundType } from '@/const/audio_config';
import { useAudio } from '@/hooks/use_audio';

const Menu = menus[0];

const ElectricPoleViewIcon = observer(() => {
  const { adapter, dataService } = useAdapter();
  const { play } = useAudio();
  const isElecricPoleVisible = adapter.electricPoleController.electricPoleVisible;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        play(SoundType.CLICK);
        dataService.electricPoleDataService.toggleVisibility();
      }}
    >
      {isElecricPoleVisible ? <VisibleIcon /> : <InVisibleIcon />}
    </div>
  );
});

const CustomPointViewIcon = observer(() => {
  const { adapter, dataService } = useAdapter();
  const isCustomPointVisible = adapter.customPointController.customPointVisible;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        dataService.customPointDataService.toggleVisibility();
      }}
    >
      {isCustomPointVisible ? <VisibleIcon /> : <InVisibleIcon />}
    </div>
  );
});

const MobileViewIcon = observer(() => {
  const isMobile = useIsMobile();
  const uiManager = useEndfieldUIManager();

  const currentTab = uiManager.currentOperatePanel.value;

  if (!isMobile) return null;

  let component = <Menu />;

  if (currentTab === CurrentOperatePanel.ELECTRIC_POLE) {
    component = <ElectricPoleViewIcon />;
  }

  if (currentTab === CurrentOperatePanel.CUSTOM_POINT) {
    component = <CustomPointViewIcon />;
  }

  return <MenuContainer rightBorder>{component}</MenuContainer>;
});

export const OperateList = observer(
  ({ startContent, endContent }: { startContent?: React.ReactNode; endContent?: React.ReactNode }) => {
    const { t } = useTranslation(['header']);
    const uiManager = useEndfieldUIManager();
    const isMobile = useIsMobile();
    const currentTab = uiManager.currentOperatePanel.value;

    return (
      <div className="flex items-stretch h-full w-full md:w-auto md:absolute md:top-0 md:bottom-0 md:left-1/2 md:-translate-x-1/2 md:z-2">
        {startContent}
        <MobileViewIcon />
        <OperateMenu
          active={currentTab === CurrentOperatePanel.FILTER}
          rightBorder
          onToggle={() => {
            uiManager.togglePanel(CurrentOperatePanel.FILTER);
          }}
        >
          {isMobile ? <FilterIcon /> : t('header:head_menu.filter')}
        </OperateMenu>
        <OperateMenu
          active={currentTab === CurrentOperatePanel.ELECTRIC_POLE}
          startIcon={!isMobile && <ElectricPoleViewIcon />}
          rightBorder
          onToggle={() => {
            uiManager.togglePanel(CurrentOperatePanel.ELECTRIC_POLE);
          }}
        >
          {isMobile ? <ElectricPoleIconPole /> : t('header:head_menu.poles')}
        </OperateMenu>
        <OperateMenu
          active={currentTab === CurrentOperatePanel.CUSTOM_POINT}
          startIcon={!isMobile && <CustomPointViewIcon />}
          rightBorder={isMobile}
          onToggle={() => {
            uiManager.togglePanel(CurrentOperatePanel.CUSTOM_POINT);
          }}
        >
          {isMobile ? <CustomPointIcon /> : t('header:head_menu.custom')}
        </OperateMenu>
        {endContent}
      </div>
    );
  }
);
