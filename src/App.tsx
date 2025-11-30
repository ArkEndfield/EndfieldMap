import React, { Suspense } from 'react';

import { LoadingScreen } from '@/components/common/loading_screen';
import { loadingManager, LoadingStageId } from '@/services/loading';

const EndfieldMap = React.lazy(() => {
  loadingManager.updateStageProgress(LoadingStageId.COMPONENTS, 10);
  return import('@/Map').then((module) => {
    loadingManager.completeStage(LoadingStageId.COMPONENTS);
    return module;
  });
});

function App() {
  return (
    <>
      <LoadingScreen />
      <Suspense fallback={null}>
        <EndfieldMap />
      </Suspense>
    </>
  );
}

export default App;
