import type { TooltipProps } from '@endfieldmap/map-web-theme-types/tooltip';
import { observer } from 'mobx-react-lite';
import { Suspense } from 'react';

import uiManager from '@/services/ui_manager';

const TooltipRenderer = observer(<T extends React.ElementType = 'div'>(props: TooltipProps<T>) => {
  const TooltipComponent = uiManager.ThemedComponents.tooltip.Tooltip;

  if (!TooltipComponent) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <TooltipComponent {...props} />
    </Suspense>
  );
});

export const Tooltip = <T extends React.ElementType = 'div'>(props: TooltipProps<T>) => {
  return <TooltipRenderer {...props} />;
};

export type { TooltipProps };
