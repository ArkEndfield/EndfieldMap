import React, { Suspense } from 'react';

import { LoadingScreen } from '@/components/common/loading_screen';
import { LoadingStageId } from '@/const/loading';
import { loadingManager } from '@/services/loading';

const EndfieldMap = React.lazy(async () => {
  loadingManager.updateStageProgress(LoadingStageId.COMPONENTS, 10);
  const module = await import('@/Map');
  loadingManager.completeStage(LoadingStageId.COMPONENTS);
  return module;
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
