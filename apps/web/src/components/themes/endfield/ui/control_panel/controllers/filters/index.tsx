import { MarkedFeatureFilterMode } from '@endfieldmap/map-core';
import { cn } from '@endfieldmap/tools';
import { Tooltip, ZmdSquareButton } from '@endfieldmap/web-components';
import { RefreshIcon } from '@endfieldmap/web-components';
import { FilterMarked, FilterUnMarked } from '@endfieldmap/web-components';
import ToggleButton from '@themes/endfield/ui/control_panel/components/toggle_button';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { service } from '@/services';

const filterModes = [
  { label: 'marked', value: MarkedFeatureFilterMode.Marked, icon: FilterMarked },
  { label: 'unmarked', value: MarkedFeatureFilterMode.Unmarked, icon: FilterUnMarked },
] as const;

export const Filters = observer(({ className, extra }: { className?: string; extra?: React.ReactNode }) => {
  const { t } = useTranslation('sidebar');

  const filterMode = service.dataService.mapDataService.mapStateDataService.filterMarked.value;

  const clearFilterSelect = () => {
    service.dataService.mapDataService.entityDataService.resetAllVisibility();
    service.dataService.mapDataService.mapStateDataService.filterMarked.value = MarkedFeatureFilterMode.All;
  };

  return (
    <div className={cn('flex gap-2 justify-between items-center p-2', className)}>
      <ZmdSquareButton type="default" className="flex-1" icon={<RefreshIcon />} onClick={clearFilterSelect}>
        {t('filter.reset')}
      </ZmdSquareButton>
      {filterModes.map((mode) => (
        <Tooltip tooltip={t(`filter.${mode.label}`)} placement="top" key={mode.value}>
          <ToggleButton
            value={filterMode === mode.value}
            className="text-lg w-8 h-8"
            onChange={(v) => {
              if (v) {
                service.dataService.mapDataService.mapStateDataService.filterMarked.value = mode.value;
              } else {
                service.dataService.mapDataService.mapStateDataService.filterMarked.value = MarkedFeatureFilterMode.All;
              }
            }}
          >
            <mode.icon />
          </ToggleButton>
        </Tooltip>
      ))}
      {extra}
    </div>
  );
});
