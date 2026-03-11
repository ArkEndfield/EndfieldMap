import { cn } from '@endfieldmap/tools';
import { useIsMobile } from '@endfieldmap/web-components';
import CustomPointPresetPanel from '@themes/endfield/ui/control_panel/controllers/operations/custom_point/preset/panel';
import { observer } from 'mobx-react-lite';

export const CustomPointManager: React.FC = observer(() => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        'top-0 left-0 h-full w-full pt-1 overflow-hidden transition-all bg-[#272727] z-2 flex flex-col',
        isMobile ? 'relative' : 'absolute z-5'
      )}
    >
      <CustomPointPresetPanel />
    </div>
  );
});
