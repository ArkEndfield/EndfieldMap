import { useTranslation } from '@endfieldmap/map-service';
import { Tooltip, ZmdSquareButton, ZmdSquareIconButton } from '@endfieldmap/web-components';

import { BatchDeleteIcon, ExportIcon, ImportIcon, StoreIcon } from '@endfieldmap/web-components';

interface PresetToolbarProps {
  hasSelection: boolean;
  onExport: () => void;
  onDelete: () => void;
  onImport: () => void;
  onOpenStore: () => void;
}

const PresetToolbar: React.FC<PresetToolbarProps> = ({ hasSelection, onExport, onDelete, onImport, onOpenStore }) => {
  const { t } = useTranslation(['common', 'sidebar']);

  return (
    <div className="flex gap-2 justify-between items-center">
      <ZmdSquareButton type="default" onClick={onOpenStore} icon={<StoreIcon />} className="flex-1">
        {t('sidebar:preset_store.title')}
      </ZmdSquareButton>
      <Tooltip tooltip={t('sidebar:operation.electric_pole.preset.export_select')} placement="top">
        <ZmdSquareIconButton onClick={onExport} disabled={!hasSelection} className="text-lg w-8 h-8">
          <ExportIcon />
        </ZmdSquareIconButton>
      </Tooltip>
      <Tooltip tooltip={t('batch_delete')} placement="top">
        <ZmdSquareIconButton onClick={onDelete} disabled={!hasSelection} className="text-lg w-8 h-8 text-[#ff4d4f]">
          <BatchDeleteIcon />
        </ZmdSquareIconButton>
      </Tooltip>
      <Tooltip tooltip={t('sidebar:operation.electric_pole.preset.import.button')} placement="top">
        <ZmdSquareIconButton onClick={onImport} className="text-lg w-8 h-8">
          <ImportIcon />
        </ZmdSquareIconButton>
      </Tooltip>
    </div>
  );
};

export default PresetToolbar;
