import React from 'react';

import { MiniGameLockComponent } from './mini-game-lock';
import type { InteractiveLockComponentData } from './types';

interface InteractiveLockComponentProps {
  prop: InteractiveLockComponentData;
}

export function InteractiveLockComponent({ prop }: InteractiveLockComponentProps) {
  const { lockData } = prop;

  return (
    <>
      {lockData.map((lock) => {
        if (lock.unlockType === 'MiniGame') {
          return <MiniGameLockComponent key={lock.unlockType} prop={lock} />;
        }
        return null;
      })}
    </>
  );
}
