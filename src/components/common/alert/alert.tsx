import { Suspense } from 'react';
import { observer } from 'mobx-react-lite';

import uiManager from '@/services/ui_manager';
import { type ZmdAlertProps } from '@/components/common/alert/types';

const AlertRenderer = observer((props: ZmdAlertProps) => {
  const AlertComponent = uiManager.ThemedComponents.alert.Alert;

  if (!AlertComponent) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AlertComponent {...props} />
    </Suspense>
  );
});

export const ZmdAlert = (props: ZmdAlertProps) => {
  return <AlertRenderer {...props} />;
};

export type { ZmdAlertProps };
