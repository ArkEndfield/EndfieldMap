import { MarkedFeatureFilterMode } from '@endfieldmap/map-core';
import { ZmdSquareButton } from '@/components/common/endfield_components/button/square_button';
import { RefreshIcon } from '@/components/common/icons';
import ToggleButton from '@/components/themes/endfield/control_panel/components/toggle_button';
import Tooltip from '@themes/endfield/components/tooltip';
import { observer } from 'mobx-react-lite';

import { useAdapter } from '@/hooks/use_adapter';
import { cn } from '@/utils/style';
import { CheckCircleIcon, CloseSquareIcon } from '@/components/common/icons';
import { useTranslation } from 'react-i18next';

const filterModes = [
  { label: 'marked', value: MarkedFeatureFilterMode.Marked, icon: CheckCircleIcon },
  { label: 'unmarked', value: MarkedFeatureFilterMode.Unmarked, icon: CloseSquareIcon },
] as const;

export const Filters = observer(({ className, extra }: { className?: string; extra?: React.ReactNode }) => {
  const { dataService, adapter } = useAdapter();
  const { t } = useTranslation('sidebar');

  const filterMode = dataService.mapStateDataService.filterMarked.value;

  const clearFilterSelect = () => {
    adapter.entityController.hideAllEntities();
  };

  return (
    <div className={cn('flex gap-2 justify-between items-center p-2', className)}>
      <ZmdSquareButton type="default" className="flex-1" icon={<RefreshIcon />} onClick={clearFilterSelect}>
        重置
      </ZmdSquareButton>
      {filterModes.map((mode) => (
        <Tooltip tooltip={t(`filter.${mode.label}`)} placement="top" key={mode.value}>
          <ToggleButton
            value={filterMode === mode.value}
            className="text-lg w-8 h-8"
            onChange={(v) => {
              if (v) {
                dataService.mapStateDataService.filterMarked.value = mode.value;
              } else {
                dataService.mapStateDataService.filterMarked.value = MarkedFeatureFilterMode.All;
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
