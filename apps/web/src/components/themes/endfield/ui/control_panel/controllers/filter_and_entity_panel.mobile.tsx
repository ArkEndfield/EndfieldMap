import { ScrollArea } from '@endfieldmap/web-components';
import EntityPanel from '@themes/endfield/ui/control_panel/controllers/entity_panel';
import { Filters } from '@themes/endfield/ui/control_panel/controllers/filters';
import { SelectModeOperation } from '@themes/endfield/ui/control_panel/controllers/operations/select_mode';

export const FilterAndEntityPanelMobile = () => {
  return (
    <>
      <div className="w-full h-full flex flex-col text-white">
        <ScrollArea className="w-full flex-1">
          <EntityPanel />
        </ScrollArea>
        <Filters extra={<SelectModeOperation />} />
      </div>
    </>
  );
};
