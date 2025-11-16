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
  const lastCreatedSecondPoleIdRef = useRef<number | null>(null);

  const handleCreateElectricPole = () => {
    if (adapter) {
      const f1 = adapter.electricPoleController.createElectricPoleEntity(
        adapter.currentMapIndex,
        [103.72972125, 125.6243025]
      );
      const f2 = adapter.electricPoleController.createElectricPoleEntity(
        adapter.currentMapIndex,
        [113.72972125, 125.6243025]
      );

      const f3 = adapter.electricPoleController.createElectricPoleEntity(
        adapter.currentMapIndex,
        [114.72972125, 127.6243025]
      );
      if (f1 && f2 && f3) {
        f1.connectTo(f2);
        f2.connectTo(f3);
        // 记录第二个创建的电线杆的逻辑ID，方便后续删除
        lastCreatedSecondPoleIdRef.current = f2.data.levelLogicId;
      }
    }
  };

  const handleDeleteSecondElectricPole = () => {
    if (adapter && lastCreatedSecondPoleIdRef.current != null) {
      adapter.electricPoleController.deleteElectricPoleEntity(
        adapter.currentMapIndex,
        lastCreatedSecondPoleIdRef.current
      );
      // 删除后清空记录，避免重复删除
      lastCreatedSecondPoleIdRef.current = null;
    }
  };

  return (
    <div className="relative w-screen h-screen">
      {/* 地图容器 */}
      <div ref={container} className="w-full h-full"></div>

      {/* 悬浮按钮 */}
      {adapter && (
        <button
          onClick={handleCreateElectricPole}
          className="absolute top-4 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow-lg transition-colors"
          title="在指定位置创建电线杆"
        >
          创建电线杆
        </button>
      )}

      {adapter && (
        <button
          onClick={handleDeleteSecondElectricPole}
          className="absolute top-16 right-4 z-50 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg shadow-lg transition-colors"
          title="删除第二个创建的电线杆"
        >
          删除第二个电线杆
        </button>
      )}

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
