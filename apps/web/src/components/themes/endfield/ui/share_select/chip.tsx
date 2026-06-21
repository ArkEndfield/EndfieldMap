import { type EntityInfoStats } from '@endfieldmap/map-core';
import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';

import { useEntityName } from '@/hooks/use_entity_name';
import { getEntityIcon } from '@/utils/entity';

interface ShareSelectChipProps {
  stats: EntityInfoStats;
  /** category not present on the current map */
  isOffMap: boolean;
  /** dimmed when present on the current map but currently hidden */
  dimmed: boolean;
  onClick: () => void;
}

export const ShareSelectChip = observer(({ stats, isOffMap, dimmed, onClick }: ShareSelectChipProps) => {
  const { name } = useEntityName(stats);
  const iconSrc = getEntityIcon(stats.category, stats.entityInfo.pic);

  return (
    <ButtonWithAudio
      onClick={onClick}
      soundType={SoundType.TICK}
      className={cn(
        'relative flex items-center gap-1 rounded-full select-none',
        'bg-[#1d1d1d] border-[0.5px] border-[#898989]/30 text-[#cccccc] text-xs',
        'px-2 py-1 hover:bg-[#222222] transition-colors',
        dimmed && !isOffMap && 'opacity-40'
      )}
    >
      <div className="w-5 h-5 shrink-0 rounded-full bg-white/5 flex items-center justify-center">
        {iconSrc && <img src={iconSrc} alt={name} className="w-full h-full object-contain" />}
      </div>
      <span className="max-w-[8rem] truncate">{name}</span>
      {isOffMap && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#fffa00] ring-2 ring-[#1d1d1d]" />
      )}
    </ButtonWithAudio>
  );
});
