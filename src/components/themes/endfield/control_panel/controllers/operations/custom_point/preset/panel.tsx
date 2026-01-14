import PresetHeader from '@/components/themes/endfield/control_panel/controllers/operations/custom_point/preset/header';
import PresetSelectBar from '@/components/themes/endfield/control_panel/controllers/operations/electric_pole/preset/select_bar';

import { observer } from 'mobx-react-lite';

import { ScrollArea } from '@/components/common/scroll_area';
import { useCustomPointPresetPanel } from '@/hooks/use_custom_point_preset_panel';
import PresetList from '@themes/endfield/control_panel/controllers/operations/components/preset/list';
import PresetToolbar from '@themes/endfield/control_panel/controllers/operations/components/preset/toolbar';

/**
 * 自定义标点预设管理面板
 */
const CustomPointPresetPanel: React.FC = observer(() => {
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
  } = useCustomPointPresetPanel();

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

export default CustomPointPresetPanel;
