import { MarkedFeatureFilterMode, type EndfieldMapAdapter } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import FilterToggle from './_toggle';

const filterModes = [
  { label: '全部', value: MarkedFeatureFilterMode.All },
  { label: '已标记', value: MarkedFeatureFilterMode.Marked },
  { label: '未标记', value: MarkedFeatureFilterMode.Unmarked },
];

export const Filters = observer(({ adapter }: { adapter: EndfieldMapAdapter }) => {
  const filterMode = adapter.entityController.markedFilterMode;
  const setFilterMode = (mode: MarkedFeatureFilterMode) => {
    adapter.activeFeatureController.clearActiveFeature();
    adapter.entityController.setMarkedFeatureFilter(mode);
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
            {mode.label}
          </FilterToggle>
        ))
      }
    </div>
  );
});
