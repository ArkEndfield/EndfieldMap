import { cn } from '@/utils/style';
import { useTranslation } from 'react-i18next';

interface PresetToolbarProps {
  hasSelection: boolean;
  onExport: () => void;
  onDelete: () => void;
  onImport: () => void;
}

const PresetToolbar: React.FC<PresetToolbarProps> = ({ hasSelection, onExport, onDelete, onImport }) => {
  const { t } = useTranslation(['sidebar']);

  return (
    <div className="flex items-center justify-between gap-1.5 pt-1 shrink-0 font-bold">
      <button
        onClick={onExport}
        className={
          cn(
            "flex-1 text-xs py-1 px-1.5 rounded transition-colors",
            "bg-[#D9D9D9] hover:bg-[#c4c4c4] text-[#404040]",
            "disabled:hover:bg-[#D9D9D9] disabled:opacity-50",
            "flex items-center gap-1.5"
          )
        }
        disabled={!hasSelection}
      >
        <div className='flex-1 h-[1.5px] bg-[#E2E2E2]'></div>
        <div className='shrink-0'>{t('sidebar:operation.electric_pole.preset.export_select')}</div>
        <div className='flex-1 h-[1.5px] bg-[#E2E2E2]'></div>
      </button>
      <button
        onClick={onDelete}
        className={
          cn(
            "text-xs py-1 px-4 rounded transition-colors",
            "bg-[#D9D9D9] hover:bg-[#c4c4c4] text-[#EE3838]",
            "disabled:hover:bg-[#D9D9D9] disabled:opacity-50"
          )
        }
        disabled={!hasSelection}
      >
        {t('sidebar:operation.electric_pole.preset.batch_delete')}
      </button>
      <button
        onClick={onImport}
        className="bg-[#FCFB1E] hover:bg-[#ecec20] text-[#404040] text-xs py-1 px-4 rounded transition-colors"
      >
        {t('sidebar:operation.electric_pole.preset.import.button')}
      </button>
    </div>
  );
};

export default PresetToolbar;
