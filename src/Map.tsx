import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import { lazy, Suspense, useEffect, useRef } from 'react';

import { AdapterProvider } from '@/components/common/adapter_provider';
import { DevTip } from '@/components/common/dev_tip';
import { SettingsPage } from '@/components/common/settings';
import ZmdSwiper from '@/components/common/zmd_swiper';
import { useMapAdapter } from '@/hooks/use_init_map_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { DataService } from '@/services/data';
import { isDev } from '@/services/env';
import uiManager from '@/services/ui_manager';
import { cn } from '@/utils/style';

const DevTools = isDev ? lazy(() => import('@/components/common/dev_tools')) : null;

export interface ControllersProps {
  adapter: EndfieldMapAdapter;
  dataService: DataService;
}

const Controllers = observer(({ adapter, dataService }: ControllersProps) => {
  const isMobile = useIsMobile();
  const enableHover = adapter.enableHover;
  const hoverHitTestTime = dataService.mapStateDataService.hoverTime.value;
  const ThemedComponents = uiManager.ThemedComponents;

  useEffect(() => {
    if (isMobile && enableHover) {
      adapter.setHoverFeatureEnable(false);
    } else if (!isMobile && !enableHover && hoverHitTestTime !== -1) {
      adapter.setHoverFeatureEnable(true);
    }
  }, [adapter, enableHover, hoverHitTestTime, isMobile]);

  return (
    <AdapterProvider adapter={adapter} dataService={dataService}>
      <Suspense>
        <ThemedComponents.RootProvider dataService={dataService}>
          {/* 弹窗组件 */}
          <Suspense>
            <ThemedComponents.map.Popup />
          </Suspense>

          {/* 操作提示组件 */}
          <Suspense>
            <ThemedComponents.map.OperationTip />
          </Suspense>

          {/* 缩放组件 */}
          <Suspense>
            <ThemedComponents.map.ZoomController />
          </Suspense>

          {/* 菜单组件 */}
          <Suspense>
            <ThemedComponents.map.Menus />
          </Suspense>

          {/* 地图索引菜单 */}
          <Suspense>
            <ThemedComponents.map.MapIndexMenu />
          </Suspense>

          {/** 操作组件 */}
          <Suspense>
            <ThemedComponents.map.ControlPanel />
          </Suspense>

          {/* 层级切换组件 */}
          <Suspense>
            <ThemedComponents.map.TierManager />
          </Suspense>

          {/* DevTools */}
          {isDev && <Suspense>{DevTools && <DevTools />}</Suspense>}

          {/* 设置页面 */}
          <SettingsPage />

          {/* 轮播组件 */}
          <ZmdSwiper />

          <DevTip />
        </ThemedComponents.RootProvider>
      </Suspense>
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
