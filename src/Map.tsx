import type { EndfieldMapAdapter, MapIndex } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import { Suspense, useMemo, useRef } from 'react';

import { AdapterProvider } from '@/components/common/adapter_provider';
import { SettingsPage } from '@/components/common/settings';
import ZmdSwiper from '@/components/common/zmd_swiper';
import { getThemedComponents } from '@/components/themes';
import { ComponentType } from '@/components/themes/types';
import { useMapAdapter } from '@/hooks/use_init_map_adapter';
import { cn } from '@/utils/style';

import { DevTip } from './components/common/dev_tip';
import { DataService } from './services/data';
import uiManager from './services/ui_manager';

export interface ControllersProps {
  adapter: EndfieldMapAdapter;
  dataService: DataService;
}

const Controllers = observer(({ adapter, dataService }: ControllersProps) => {
  const theme = uiManager.theme.value;

  const ThemedComponents = useMemo(() => {
    const components = getThemedComponents(theme);
    return {
      Popup: components.get(ComponentType.POPUP),
      ZoomController: components.get(ComponentType.ZOOM_CONTROLLER),
      Menus: components.get(ComponentType.MENUS),
      ControlPanel: components.get(ComponentType.CONTROL_PANEL),
    };
  }, [theme]);

  return (
    <AdapterProvider adapter={adapter} dataService={dataService}>
      {/* 弹窗组件 */}
      <Suspense>
        <ThemedComponents.Popup />
      </Suspense>

      {/* 缩放组件 */}
      <Suspense>
        <ThemedComponents.ZoomController />
      </Suspense>

      {/* 菜单组件 */}
      <Suspense>
        <ThemedComponents.Menus />
      </Suspense>

      {/** 操作组件 */}
      <Suspense>
        <ThemedComponents.ControlPanel />
      </Suspense>

      {/* 设置页面 */}
      <SettingsPage />

      {/* 轮播组件 */}
      <ZmdSwiper />

      <DevTip />
    </AdapterProvider>
  );
});

function EndfieldMap() {
  const container = useRef<HTMLDivElement>(null);
  const { adapter, dataService } = useMapAdapter(container);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 地图容器 */}
      <div
        ref={container}
        className={cn(
          'fixed w-full h-full',
          "dark:bg-[url('/images/bg/page-bg-dark.jpg')] bg-[url('/images/bg/page-bg-light.jpg')] bg-cover bg-center"
        )}
      ></div>

      {/* 控制组件 */}
      {adapter && dataService && <Controllers adapter={adapter} dataService={dataService} />}
    </div>
  );
}

const EndfieldMapObserver = observer(EndfieldMap);
export default EndfieldMapObserver;
