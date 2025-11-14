import React, { Suspense } from 'react';

import PageLoading from '@/components/common/PageLoading';

const EndfieldMap = React.lazy(() => import('@/Map'));

function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <EndfieldMap />
    </Suspense>
  );
}

export default App;
