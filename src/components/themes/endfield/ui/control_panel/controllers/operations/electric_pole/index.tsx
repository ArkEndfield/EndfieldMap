import ElectricPolePresetPanel from '@themes/endfield/ui/control_panel/controllers/operations/electric_pole/preset/panel';

import { useIsMobile } from '@/hooks/use_is_mobile';
import { cn } from '@/utils/style';

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
