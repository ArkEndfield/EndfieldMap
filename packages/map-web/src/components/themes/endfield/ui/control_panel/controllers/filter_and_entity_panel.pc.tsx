import EntityPanel from '@themes/endfield/ui/control_panel/controllers/entity_panel';
import { Filters } from '@themes/endfield/ui/control_panel/controllers/filters';
import { SelectModeOperation } from '@themes/endfield/ui/control_panel/controllers/operations/select_mode';

import { ScrollArea } from '@endfieldmap/web-components';

export const FilterAndEntityPanelPC = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <ScrollArea className="w-full flex-1">
        <EntityPanel />
      </ScrollArea>
      <Filters extra={<SelectModeOperation />} />
    </div>
  );
};
