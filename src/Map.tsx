import { useRef, Suspense, useState, useMemo } from 'react';

import { observer } from 'mobx-react-lite';
import { getThemedComponents, themeNames, type ThemeNames } from '@/components/themes';
import { ComponentType } from '@/components/themes/types';
import { useMapAdapter } from '@/hooks/use_init_map_adapter';
import type { EndfieldMapAdapter, MapIndex } from '@endfieldmap/map-core';
import { AdapterProvider } from '@/components/common/adapter_provider';

function Controllers({ adapter, renderMap }: { adapter: EndfieldMapAdapter, renderMap: (mapIdx?: MapIndex | undefined) => void }) {
  const [theme, _setTheme] = useState<ThemeNames>(themeNames.ENDFIELD);
  
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
    <AdapterProvider adapter={adapter} renderMap={renderMap}>
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
    </AdapterProvider>
  );
}

function EndfieldMap() {
  const container = useRef<HTMLDivElement>(null);
  const { adapter, renderMap } = useMapAdapter(container);

  return (
    <div className="relative w-screen h-screen">
      {/* 地图容器 */}
      <div ref={container} className="fixed w-full h-full"></div>

      {/* 控制组件 */}
      {adapter && <Controllers adapter={adapter} renderMap={renderMap} />}
    </div>
  );
}

const EndfieldMapObserver = observer(EndfieldMap);
export default EndfieldMapObserver;
