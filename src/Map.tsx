import { useRef, Suspense } from 'react';

import { observer } from 'mobx-react-lite';
import { getThemedComponents, themeNames } from '@/components/themes';
import { ComponentType } from '@/components/themes/types';
import { useMapAdapter } from '@/hooks/useMapAdapter';
// import i18n from './i18n';
// import { getLanguageLocale } from './utils/language';
// import { Language } from '@endfieldmap/tools';

const ThemedComponents = getThemedComponents(themeNames.ENDFIELD);

const ThemedPopup = ThemedComponents.get(ComponentType.POPUP)!;
const ThemedZoomController = ThemedComponents.get(ComponentType.ZOOM_CONTROLLER)!;
const ThemedMenus = ThemedComponents.get(ComponentType.MENUS)!;
// const ThemedEntityPanel = ThemedComponents.get(ComponentType.ENTITY_PANEL)!;

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

      {/* {adapter && (
        <div className="fixed bottom-4 right-4">
          <button onClick={() => i18n.changeLanguage(getLanguageLocale(Language.ZH_CN))}>中文</button>
          <button onClick={() => i18n.changeLanguage(getLanguageLocale(Language.EN_US))}>English</button>
        </div>
      )} */}

      {adapter && (
        <Suspense>
          <ThemedZoomController adapter={adapter} />
        </Suspense>
      )}

      {adapter && (
        <Suspense>
          <ThemedMenus adapter={adapter} />
        </Suspense>
      )}

      

      {/* {adapter && (
        <Suspense>
          <ThemedEntityPanel adapter={adapter} />
        </Suspense>
      )} */}
    </div>
  );
}

const EndfieldMapObserver = observer(EndfieldMap);
export default EndfieldMapObserver;
