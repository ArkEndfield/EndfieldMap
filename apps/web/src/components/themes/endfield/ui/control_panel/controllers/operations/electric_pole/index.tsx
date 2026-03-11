import { cn } from '@endfieldmap/tools';
import { useIsMobile } from '@endfieldmap/web-components';
import ElectricPolePresetPanel from '@themes/endfield/ui/control_panel/controllers/operations/electric_pole/preset/panel';

export const ElectricPoleManager: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        'top-0 left-0 h-full w-full pt-1 overflow-hidden transition-all bg-[#272727] z-2 flex flex-col',
        isMobile ? 'relative' : 'absolute z-5'
      )}
    >
      <ElectricPolePresetPanel />
    </div>
  );
};
