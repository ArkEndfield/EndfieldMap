import { useRef, Suspense, useState, useMemo } from 'react';

import { observer } from 'mobx-react-lite';
import { getThemedComponents, themeNames, type ThemeNames } from '@/components/themes';
import { ComponentType } from '@/components/themes/types';
import { useMapAdapter } from '@/hooks/useMapAdapter';
import type { EndfieldMapAdapter } from '@endfieldmap/map-core';

function Controllers({ adapter }: { adapter: EndfieldMapAdapter }) {
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
    <>
      {/* 弹窗组件 */}
      <Suspense>
        <ThemedComponents.Popup adapter={adapter} />
      </Suspense>

      {/* 缩放组件 */}
      <Suspense>
        <ThemedComponents.ZoomController adapter={adapter} />
      </Suspense>

      {/* 菜单组件 */}
      <Suspense>
        <ThemedComponents.Menus adapter={adapter} />
      </Suspense>

      {/** 操作组件 */}
      <Suspense>
        <ThemedComponents.ControlPanel adapter={adapter} />
      </Suspense>
    </>
  );
}

function EndfieldMap() {
  const container = useRef<HTMLDivElement>(null);
  const { adapter } = useMapAdapter(container);

  return (
    <div className="relative w-screen h-screen">
      {/* 地图容器 */}
      <div ref={container} className="w-full h-full"></div>

      {/* 控制组件 */}
      {adapter && <Controllers adapter={adapter} />}
    </div>
  );
}

const EndfieldMapObserver = observer(EndfieldMap);
export default EndfieldMapObserver;
