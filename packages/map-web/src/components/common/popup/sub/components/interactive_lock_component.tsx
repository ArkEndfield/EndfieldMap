import type { SubPopupComponentProps } from '@/components/common/popup/sub/types';
import type { InteractiveLockComponent } from '@/components/common/popup/sub/components/types';

import { MiniGameLockComponent } from '@/components/common/popup/sub/components/lock_data/mini_game';

const InteractiveLockComponent: SubPopupComponentProps<InteractiveLockComponent> = ({ prop }) => {
  const { lockData } = prop;
  return (
    <>
      {lockData.map((lock) => {
        if (lock.unlockType === 'MiniGame') {
          return <MiniGameLockComponent key={lock.unlockType} prop={lock} />;
        }
      })}
    </>
  );
};

export default InteractiveLockComponent;
