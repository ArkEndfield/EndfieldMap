import { cn } from '@endfieldmap/tools';
import { observer } from 'mobx-react-lite';

export const OperationContainer = observer(
  ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return (
      <div className={cn('bg-black/70 text-[#eeeeee] border-b-2 border-[#01ffa2] flex flex-nowrap', className)}>
        {children}
      </div>
    );
  }
);
