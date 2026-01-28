import { MarkedFeatureFilterMode } from '@endfieldmap/map-core';
import Tooltip from '@themes/endfield/components/tooltip';
import ToggleButton from '@themes/endfield/ui/control_panel/components/toggle_button';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';
import { RefreshIcon } from '@/components/common/icons';
import { FilterMarked, FilterUnMarked } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';
import { cn } from '@/utils/style';

const filterModes = [
  { label: 'marked', value: MarkedFeatureFilterMode.Marked, icon: FilterMarked },
  { label: 'unmarked', value: MarkedFeatureFilterMode.Unmarked, icon: FilterUnMarked },
] as const;

export const Filters = observer(({ className, extra }: { className?: string; extra?: React.ReactNode }) => {
  const { mapDataService } = useAdapter();
  const { t } = useTranslation('sidebar');

  const filterMode = mapDataService.mapStateDataService.filterMarked.value;

  const clearFilterSelect = () => {
    mapDataService.entityDataService.resetAllVisibility();
    mapDataService.mapStateDataService.filterMarked.value = MarkedFeatureFilterMode.All;
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
                mapDataService.mapStateDataService.filterMarked.value = mode.value;
              } else {
                mapDataService.mapStateDataService.filterMarked.value = MarkedFeatureFilterMode.All;
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
