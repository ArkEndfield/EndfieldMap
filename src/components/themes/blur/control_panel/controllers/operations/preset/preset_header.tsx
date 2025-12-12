import { useTranslation } from 'react-i18next';

import { PlusIcon } from '@/components/common/icons';
import { cn } from '@/utils/style';

interface PresetHeaderProps {
  onCreate: () => void;
  icon?: React.ReactNode;
  title?: string;
}

const PresetHeader: React.FC<PresetHeaderProps> = ({ onCreate, icon, title }) => {
  const { t } = useTranslation(['sidebar']);

  return (
    <div className="flex items-center justify-between shrink-0">
      <div className="text-xs font-semibold flex items-center gap-1.5 text-white/70">
        {icon}
        <span>{title || t('sidebar:operation.electric_pole.preset.title')}</span>
      </div>
      <button
        onClick={onCreate}
        className={cn(
          'px-2.5 py-1 rounded-lg text-[10px] font-medium',
          'bg-blue-500 hover:bg-blue-600 text-white',
          'transition-all duration-200 active:scale-95',
          'flex items-center gap-1',
          'shadow-sm shadow-blue-500/30'
        )}
      >
        <PlusIcon className="w-3 h-3" />
        {t('sidebar:operation.electric_pole.preset.create')}
      </button>
    </div>
  );
};

export default PresetHeader;
