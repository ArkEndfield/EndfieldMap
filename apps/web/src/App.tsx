import React, { Suspense } from 'react';

import { LoadingScreen } from '@/components/common/loading_screen';
import { LoadingStageId } from '@/const/loading';
import { loadingManager } from '@/services/loading';
import { SWUpdatePrompt } from '@/main.tsx';

const EndfieldMap = React.lazy(async () => {
  try {
    loadingManager.updateStageProgress(LoadingStageId.COMPONENTS, 10);
    const module = await import('@/Map');
    loadingManager.completeStage(LoadingStageId.COMPONENTS);
    return module;
  } catch (error) {
    loadingManager.setError(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
});

function App() {
  return (
    <>
      <LoadingScreen />
      <SWUpdatePrompt />
      <Suspense fallback={null}>
        <EndfieldMap />
      </Suspense>
    </>
  );
}

export default App;
