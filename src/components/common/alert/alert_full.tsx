import { Suspense } from 'react';
import { observer } from 'mobx-react-lite';

import uiManager from '@/services/ui_manager';
import { type ZmdAlertFullProps } from '@/components/common/alert/types';

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
