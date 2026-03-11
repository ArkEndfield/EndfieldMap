import { useTranslation } from 'react-i18next';
import { Logo } from '@endfieldmap/web-components';
import { PresetListItem } from '@themes/endfield/ui/control_panel/controllers/operations/components/preset/list_item';

import type { PresetItem } from '@endfieldmap/map-service';

interface PresetListProps {
  presets: PresetItem[];
  currentPresetId: string;
  selectedIds: string[];
  onSwitch: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string, name: string) => void;
}

const EmptyPresetList = () => {
  const { t } = useTranslation('sidebar');

  return (
    <div className="py-4 flex flex-col items-center justify-center gap-2 text-gray-400">
      <Logo className="text-3xl" />
      <span className="text-xs">{t('operation.preset.empty')}</span>
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
  onShare,
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
          onShare={() => onShare(preset.id, preset.name)}
        />
      ))}
    </div>
  );
};

export default PresetList;
