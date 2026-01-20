import EntityPanel from '@themes/endfield/ui/control_panel/controllers/entity_panel';
import { Filters } from '@themes/endfield/ui/control_panel/controllers/filters';
import { SelectModeOperation } from '@themes/endfield/ui/control_panel/controllers/operations/select_mode';

import { ScrollArea } from '@/components/common/scroll_area';
import { Logo } from '@/components/common/icons';

export const FilterAndEntityPanelMobile = () => {
  return (
    <>
      <Logo className="fixed h-5 bottom-2 left-1/2 -translate-x-1/2 text-white/20" />
      <div className="w-full h-full flex flex-col text-white">
        <ScrollArea className="w-full flex-1">
          <EntityPanel />
        </ScrollArea>
        <Filters extra={<SelectModeOperation />} />
      </div>
    </>
  );
};
