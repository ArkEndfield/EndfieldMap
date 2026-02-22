import { observer } from 'mobx-react-lite';
import React from 'react';

import { alertStore } from './alert-store';
import { EndfieldAlert } from './endfield-alert';

export const AlertProvider: React.FC = observer(() => {
  return (
    <>
      {alertStore.alerts.map((instance) => (
        <EndfieldAlert key={instance.id} instance={instance} />
      ))}
    </>
  );
});
