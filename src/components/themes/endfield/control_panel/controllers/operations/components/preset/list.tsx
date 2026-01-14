import { PresetListItem } from '@themes/endfield/control_panel/controllers/operations/components/preset/list_item';
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
    <div className="rounded-md max-h-64 overflow-y-auto bg-white/10">
      <div className="py-6 text-center text-xs text-gray-400">{t('operation.preset.empty')}</div>
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
