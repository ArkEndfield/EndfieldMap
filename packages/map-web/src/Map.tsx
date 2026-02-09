import type { EndfieldMapAdapter } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import { lazy, Suspense, useEffect, useRef } from 'react';

import { AdapterProvider } from '@/components/common/adapter_provider';
import { DevTip } from '@/components/common/dev_tip';
import { SettingsPage } from '@/components/features/settings';
import { useMapAdapter } from '@/hooks/use_init_map_adapter';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { MapDataService } from '@/services/data/map';
import { isDev } from '@/services/env';
import uiManager from '@/services/ui_manager';
import { cn } from '@/utils/style';
import type { MapService } from '@/services/map';

const DevTools = isDev ? lazy(() => import('@/components/features/dev_tools')) : null;
const ZmdSwiper = lazy(() => import('@/components/features/swiper'));
const PresetStore = lazy(() => import('@/components/features/preset_store'));

export interface ControllersProps {
  adapter: EndfieldMapAdapter;
  mapDataService: MapDataService;
  mapService: MapService;
}

const Controllers = observer(({ adapter, mapDataService, mapService }: ControllersProps) => {
  const isMobile = useIsMobile();
  const enableHover = adapter.enableHover;
  const hoverHitTestTime = mapDataService.mapStateDataService.hoverTime.value;
  const ThemedComponents = uiManager.ThemedComponents;

  useEffect(() => {
    if (isMobile && enableHover) {
      adapter.setHoverFeatureEnable(false);
    } else if (!isMobile && !enableHover && hoverHitTestTime !== -1) {
      adapter.setHoverFeatureEnable(true);
    }
  }, [adapter, enableHover, hoverHitTestTime, isMobile]);

  return (
    <AdapterProvider adapter={adapter} mapDataService={mapDataService} mapService={mapService}>
      <Suspense>
        <ThemedComponents.RootProvider mapDataService={mapDataService}>
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

          {/* 更多操作组件 */}
          <Suspense>
            <ThemedComponents.map.ExtraOperation />
          </Suspense>

          {/* DevTools */}
          {isDev && <Suspense>{DevTools && <DevTools />}</Suspense>}

          {/* 设置页面 */}
          <SettingsPage />

          {/* 轮播组件 */}
          <Suspense>
            <ZmdSwiper />
          </Suspense>

          <DevTip />
        </ThemedComponents.RootProvider>
      </Suspense>

      {/* 预设商店 - 全局组件 */}
      <Suspense>
        <PresetStore />
      </Suspense>
    </AdapterProvider>
  );
});

function EndfieldMap() {
  const container = useRef<HTMLDivElement>(null);
  const { adapter, mapDataService, mapService } = useMapAdapter(container);

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
      {adapter && mapDataService && mapService && (
        <Controllers adapter={adapter} mapDataService={mapDataService} mapService={mapService} />
      )}
    </div>
  );
}

const EndfieldMapObserver = observer(EndfieldMap);
export default EndfieldMapObserver;
