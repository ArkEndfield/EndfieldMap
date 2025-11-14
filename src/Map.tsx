import { useRef, Suspense } from 'react';

import { observer } from 'mobx-react-lite';
import { getThemedComponents, themeNames } from '@/components/themes';
import { ComponentType } from '@/components/themes/types';
import { useMapAdapter } from '@/hooks/useMapAdapter';

const ThemedComponents = getThemedComponents(themeNames.ENDFIELD);

const ThemedPopup = ThemedComponents.get(ComponentType.POPUP)!;
const ThemedEntityPanel = ThemedComponents.get(ComponentType.ENTITY_PANEL)!;

function EndfieldMap() {
  const container = useRef<HTMLDivElement>(null);
  const { adapter } = useMapAdapter(container);

  return (
    <div className="relative w-screen h-screen">
      {/* 地图容器 */}
      <div ref={container} className="w-full h-full"></div>

      {/* 弹窗组件 */}
      {adapter && (
        <Suspense>
          <ThemedPopup adapter={adapter} />
        </Suspense>
      )}

      {adapter && (
        <Suspense>
          <ThemedEntityPanel adapter={adapter} />
        </Suspense>
      )}
    </div>
  );
}

export default observer(EndfieldMap);
