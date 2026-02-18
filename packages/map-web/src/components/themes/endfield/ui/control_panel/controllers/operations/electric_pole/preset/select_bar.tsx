import { useTranslation } from 'react-i18next';

import { Toggle } from '@/components/common/toggle';

interface PresetSelectBarProps {
  total: number;
  selectedCount: number;
  isSelectedAll: boolean;
  isIndeterminate: boolean;
  onToggleSelectAll: () => void;
}

const PresetSelectBar: React.FC<PresetSelectBarProps> = ({
  total,
  selectedCount,
  isSelectedAll,
  isIndeterminate,
  onToggleSelectAll,
}) => {
  const { t } = useTranslation(['common', 'sidebar']);

  return (
    <div className="flex items-center justify-between text-xs shrink-0">
      <Toggle
        checked={isSelectedAll}
        isIndeterminate={isIndeterminate}
        onToggle={onToggleSelectAll}
        label={t('select_all')}
        hideBorder
        className="gap-1"
      />

      <span className="text-[11px] text-gray-400">
        {t('sidebar:operation.electric_pole.preset.select_info', { total, select: selectedCount })}
      </span>
    </div>
  );
};

export default PresetSelectBar;
