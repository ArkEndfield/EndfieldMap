import { MarkedFeatureFilterMode } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import FilterToggle from './_toggle';
import { useTranslation } from 'react-i18next';
import { useAdapter } from '@/hooks/use_adapter';
import { dataService } from '@/services/data';

const filterModes = [
  { label: 'all', value: MarkedFeatureFilterMode.All },
  { label: 'marked', value: MarkedFeatureFilterMode.Marked },
  { label: 'unmarked', value: MarkedFeatureFilterMode.Unmarked },
] as const;

export const Filters = observer(() => {
  const { adapter } = useAdapter();
  const { t } = useTranslation('sidebar');

  const filterMode = adapter.entityController.markedFilterMode;

  const setFilterMode = (mode: MarkedFeatureFilterMode) => {
    adapter.activeFeatureController.clearActiveFeature();
    dataService.setFilterMarkedMode(mode);
  };

  return (
    <div className="flex text-sm gap-2 w-full">
      {
        filterModes.map((mode) => (
          <FilterToggle
            key={mode.value}
            className='flex-1'
            checked={filterMode === mode.value}
            onChange={(v) => {
              if (v) {
                setFilterMode(mode.value);
              }
            }}
          >
            {t(`filter.${mode.label}`)}
          </FilterToggle>
        ))
      }
    </div>
  );
});
