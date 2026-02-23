import type { EndfieldMapAdapter } from '@endfieldmap/map-adapter-ol';
import { useTranslation } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { useIsMobile, WindowProvider,ZmdSquareButton } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { AdapterProvider } from '@/components/common/adapter_provider';
import { DevTip } from '@/components/common/dev_tip';
import { ChevronUp } from '@/components/common/icons';
import { SettingsPage } from '@/components/features/settings';
import { useMapAdapter } from '@/hooks/use_init_map_adapter';
import { useMapPiP } from '@/hooks/use_map_pip';
import { usePiP } from '@/hooks/use_pip';
import { service } from '@/services';
import { isDev } from '@/services/env';
import uiManager from '@/services/ui_manager';

const DevTools = isDev ? lazy(() => import('@/components/features/dev_tools')) : null;
const ZmdSwiper = lazy(() => import('@/components/features/swiper'));
const PresetStore = lazy(() => import('@/components/features/preset_store'));

export interface ControllersProps {
  adapter: EndfieldMapAdapter;
}

const Controllers = observer(({ adapter }: ControllersProps) => {
  const isMobile = useIsMobile();
  const enableHover = adapter.enableHover;
  const hoverHitTestTime = service.dataService.mapDataService.mapStateDataService.hoverTime.value;
  const ThemedComponents = uiManager.ThemedComponents;

  useEffect(() => {
    if (isMobile && enableHover) {
      adapter.setHoverFeatureEnable(false);
    } else if (!isMobile && !enableHover && hoverHitTestTime !== -1) {
      adapter.setHoverFeatureEnable(true);
    }
  }, [adapter, enableHover, hoverHitTestTime, isMobile]);

  return (
    <AdapterProvider adapter={adapter}>
      <Suspense>
        <ThemedComponents.RootProvider>
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
  const { t } = useTranslation('common');
  const container = useRef<HTMLDivElement>(null);
  const { adapter } = useMapAdapter(container);
  const { pipWindow, requestPiP, closePiP, isSupported } = usePiP({
    onClose: () => uiManager.setPiPStatus(false),
  });

  // 处理画中画窗口状态
  useEffect(() => {
    uiManager.setPiPSupported(isSupported);
    uiManager.requestPiP = () => {
      const width = Math.min(window.screen.availWidth, 1200);
      const height = Math.min(window.screen.availHeight, 800);
      requestPiP(width, height);
    };
    uiManager.exitPiP = closePiP;
    uiManager.setPiPStatus(!!pipWindow);
  }, [isSupported, requestPiP, closePiP, pipWindow]);

  // 监听窗口变化，同步地图目标和尺寸
  useMapPiP(adapter, container, pipWindow);

  const content = (
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
      {adapter && service.dataService.mapDataService && (
        <Controllers adapter={adapter} />
      )}
    </div>
  );

  if (pipWindow) {
    return (
      <>
        <div
          className={cn(
            'w-full h-full flex flex-col items-center justify-center',
            "dark:bg-[url('/images/bg/page-bg-dark.jpg')] bg-[url('/images/bg/page-bg-light.jpg')] bg-cover bg-center"
          )}
        >
          <p className="text-xl text-[#4d4d4d] dark:text-[#979797] font-bold mb-8">{t('pip.playing')}</p>
          <ZmdSquareButton
            className="text-lg w-48 rounded-lg py-3"
            onClick={() => closePiP()}
            icon={<ChevronUp className="rotate-270" />}
          >
            {t('pip.back')}
          </ZmdSquareButton>
        </div>
        <WindowProvider window={pipWindow}>{createPortal(content, pipWindow.document.body)}</WindowProvider>
      </>
    );
  }

  return content;
}

const EndfieldMapObserver = observer(EndfieldMap);
export default EndfieldMapObserver;
