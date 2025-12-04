import { MarkedFeatureFilterMode } from '@endfieldmap/map-core';
import FilterToggle from '@themes/endfield/control_panel/controllers/filters/_toggle';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/hooks/use_adapter';

const filterModes = [
  { label: 'all', value: MarkedFeatureFilterMode.All },
  { label: 'marked', value: MarkedFeatureFilterMode.Marked },
  { label: 'unmarked', value: MarkedFeatureFilterMode.Unmarked },
] as const;

export const Filters = observer(() => {
  const { dataService } = useAdapter();
  const { t } = useTranslation('sidebar');

  const filterMode = dataService.mapStateDataService.filterMarked.value;

  return (
    <div className="flex text-sm gap-2 w-full">
      {filterModes.map((mode) => (
        <FilterToggle
          key={mode.value}
          className="flex-1"
          checked={filterMode === mode.value}
          onChange={(v) => {
            if (v) {
              dataService.mapStateDataService.filterMarked.value = mode.value;
            }
          }}
        >
          {t(`filter.${mode.label}`)}
        </FilterToggle>
      ))}
    </div>
  );
});
