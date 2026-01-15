import { observer } from 'mobx-react-lite';

import PresetHeader from '@themes/endfield/ui/control_panel/controllers/operations/electric_pole/preset/header';
import PresetSelectBar from '@themes/endfield/ui/control_panel/controllers/operations/electric_pole/preset/select_bar';
import PresetList from '@themes/endfield/ui/control_panel/controllers/operations/components/preset/list';
import PresetToolbar from '@themes/endfield/ui/control_panel/controllers/operations/components/preset/toolbar';

import { ScrollArea } from '@/components/common/scroll_area';
import { usePresetPanel } from '@/hooks/use_preset_panel';

/**
 * 电线杆预设管理面板
 */
const ElectricPolePresetPanel: React.FC = observer(() => {
  const {
    presets,
    currentPresetId,
    selectedIds,
    fileInputRef,
    isSelectedAll,
    isIndeterminate,
    handleCreatePreset,
    handleSwitchPreset,
    handleToggleSelect,
    handleToggleSelectAll,
    handleExportSelected,
    handleDeleteSelected,
    handleDeletePreset,
    handleRenamePreset,
    handleClickImport,
    handleImportFileChange,
  } = usePresetPanel();

  return (
    <div className="flex-1 overflow-hidden py-3 flex flex-col gap-2">
      <div className="px-3">
        <PresetHeader onCreate={handleCreatePreset} />
      </div>

      <div className="px-3">
        <PresetSelectBar
          total={presets.length}
          selectedCount={selectedIds.length}
          isSelectedAll={isSelectedAll}
          isIndeterminate={isIndeterminate}
          onToggleSelectAll={handleToggleSelectAll}
        />
      </div>

      <ScrollArea className="flex-1 px-1">
        <PresetList
          presets={presets}
          currentPresetId={currentPresetId}
          selectedIds={selectedIds}
          onSwitch={handleSwitchPreset}
          onToggleSelect={handleToggleSelect}
          onRename={handleRenamePreset}
          onDelete={handleDeletePreset}
        />
      </ScrollArea>

      <div className="px-3">
        <PresetToolbar
          hasSelection={selectedIds.length > 0}
          onExport={handleExportSelected}
          onDelete={handleDeleteSelected}
          onImport={handleClickImport}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFileChange}
      />
    </div>
  );
});

export default ElectricPolePresetPanel;
