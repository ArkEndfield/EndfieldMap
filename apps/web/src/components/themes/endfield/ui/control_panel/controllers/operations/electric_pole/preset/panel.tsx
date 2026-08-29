import { useElectricPolePresetPanel } from '@endfieldmap/map-hooks';
import type { ElectricPoleType } from '@endfieldmap/map-service';
import { ScrollArea } from '@endfieldmap/web-components';
import PresetList from '@themes/endfield/ui/control_panel/controllers/operations/components/preset/list';
import PresetToolbar from '@themes/endfield/ui/control_panel/controllers/operations/components/preset/toolbar';
import PresetHeader from '@themes/endfield/ui/control_panel/controllers/operations/electric_pole/preset/header';
import PresetSelectBar from '@themes/endfield/ui/control_panel/controllers/operations/electric_pole/preset/select_bar';
import SharePresetForm from '@themes/endfield/ui/control_panel/controllers/operations/electric_pole/preset/share_form';
import { observer } from 'mobx-react-lite';

import { alert } from '@/components/common/alert/alert_api';
import { service } from '@/services';
import uiManager from '@/services/ui_manager';
import { catchErrorWithTip } from '@/utils/handler';

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
  } = useElectricPolePresetPanel(service);

  const handleOpenStore = () => {
    uiManager.openPresetStore('electric_pole');
  };

  const handleShare = (id: string, name: string) => {
    if (!service.dataService.mapDataService.electricPoleDataService.canShare) {
      return;
    }
    let shareName = name;
    let shareType: ElectricPoleType = 'pole';
    let shareDescription = '';

    alert.confirm({
      dismissible: false,
      content: (
        <SharePresetForm
          defaultName={name}
          defaultType={shareType}
          defaultDescription={shareDescription}
          onNameChange={(value) => {
            shareName = value;
          }}
          onTypeChange={(value) => {
            shareType = value;
          }}
          onDescriptionChange={(value) => {
            shareDescription = value;
          }}
        />
      ),
      onConfirm: () =>
        catchErrorWithTip(async () => {
          await service.dataService.mapDataService.electricPoleDataService.sharePreset(
            id,
            shareName,
            shareDescription,
            shareType
          );
          alert.info('分享成功');
        }),
    });
  };

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
          onShare={handleShare}
        />
      </ScrollArea>

      <div className="px-3">
        <PresetToolbar
          hasSelection={selectedIds.length > 0}
          onExport={handleExportSelected}
          onDelete={handleDeleteSelected}
          onImport={handleClickImport}
          onOpenStore={handleOpenStore}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => handleImportFileChange(e.target.files?.[0])}
      />
    </div>
  );
});

export default ElectricPolePresetPanel;
