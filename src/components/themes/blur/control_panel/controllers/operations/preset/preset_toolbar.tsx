import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/style';

interface PresetToolbarProps {
  hasSelection: boolean;
  onExport: () => void;
  onDelete: () => void;
  onImport: () => void;
}

const PresetToolbar: React.FC<PresetToolbarProps> = ({ hasSelection, onExport, onDelete, onImport }) => {
  const { t } = useTranslation(['common', 'sidebar']);

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        onClick={onExport}
        className={cn(
          'flex-1 text-[10px] py-1.5 px-2 rounded-lg transition-all duration-200',
          'border border-white/10 font-medium',
          hasSelection
            ? 'bg-white/10 hover:bg-white/15 text-white active:scale-95'
            : 'bg-white/5 text-white/30 cursor-not-allowed'
        )}
        disabled={!hasSelection}
      >
        {t('sidebar:operation.electric_pole.preset.export_select')}
      </button>
      <button
        onClick={onDelete}
        className={cn(
          'text-[10px] py-1.5 px-2.5 rounded-lg transition-all duration-200',
          'border font-medium',
          hasSelection
            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 active:scale-95'
            : 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
        )}
        disabled={!hasSelection}
      >
        {t('batch_delete')}
      </button>
      <button
        onClick={onImport}
        className={cn(
          'bg-blue-500 hover:bg-blue-600 text-white',
          'text-[10px] py-1.5 px-2.5 rounded-lg font-medium',
          'transition-all duration-200 active:scale-95',
          'shadow-sm shadow-blue-500/30'
        )}
      >
        {t('sidebar:operation.electric_pole.preset.import.button')}
      </button>
    </div>
  );
};

export default PresetToolbar;
