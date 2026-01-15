import { observer } from 'mobx-react-lite';

import { cn } from '@/utils/style';

export const OperationContainer = observer(
  ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return (
      <div className={cn('bg-black/70 text-[#eeeeee] border-b-2 border-[#01ffa2] flex flex-wrap', className)}>
        {children}
      </div>
    );
  }
);
