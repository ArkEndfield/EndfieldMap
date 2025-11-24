import React, { Suspense } from 'react';

import PageLoading from '@/components/common/page_loading';

const EndfieldMap = React.lazy(() => import('@/Map'));

function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <EndfieldMap />
    </Suspense>
  );
}

export default App;
