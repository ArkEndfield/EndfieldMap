import { PresetListItem } from '@themes/blur/control_panel/controllers/operations/preset/preset_list_item';
import { useTranslation } from 'react-i18next';

import type { PresetItem } from '@/hooks/use_preset_panel';

interface PresetListProps {
  presets: PresetItem[];
  currentPresetId: string;
  selectedIds: string[];
  onSwitch: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}

const EmptyPresetList = () => {
  const { t } = useTranslation('sidebar');

  return (
    <div className="rounded-lg bg-white/5 border border-white/10">
      <div className="py-8 text-center text-xs text-white/40">{t('operation.preset.empty')}</div>
    </div>
  );
};

const PresetList: React.FC<PresetListProps> = ({
  presets,
  currentPresetId,
  selectedIds,
  onSwitch,
  onToggleSelect,
  onRename,
  onDelete,
}) => {
  if (presets.length === 0) {
    return <EmptyPresetList />;
  }

  return (
    <div className="space-y-2">
      {presets.map((preset, index) => (
        <PresetListItem
          title={preset.name}
          key={preset.id}
          index={index + 1}
          active={preset.id === currentPresetId}
          select={selectedIds.includes(preset.id)}
          onClick={() => onSwitch(preset.id)}
          onToggleSelect={() => onToggleSelect(preset.id)}
          onRename={() => onRename(preset.id)}
          onDelete={() => onDelete(preset.id)}
        />
      ))}
    </div>
  );
};

export default PresetList;
