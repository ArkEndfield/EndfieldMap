import { type ZmdAlertFullProps } from '@themes/types/alert';
import { observer } from 'mobx-react-lite';
import { Suspense } from 'react';

import uiManager from '@/services/ui_manager';

const AlertFullRenderer = observer((props: ZmdAlertFullProps) => {
  const AlertFullComponent = uiManager.ThemedComponents.alert.AlertFull;

  if (!AlertFullComponent) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AlertFullComponent {...props} />
    </Suspense>
  );
});

export const ZmdAlertFull = (props: ZmdAlertFullProps) => {
  return <AlertFullRenderer {...props} />;
};

export type { ZmdAlertFullProps };
