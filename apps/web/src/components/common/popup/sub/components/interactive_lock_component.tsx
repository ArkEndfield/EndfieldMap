import { MiniGameLockComponent } from '@/components/common/popup/sub/components/lock_data/mini_game';
import type { InteractiveLockComponent } from '@/components/common/popup/sub/components/types';
import type { SubPopupComponentProps } from '@/components/common/popup/sub/types';

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
