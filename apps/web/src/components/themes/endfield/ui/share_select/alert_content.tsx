import { type EntityInfoStats } from '@endfieldmap/map-core';
import { cn } from '@endfieldmap/tools';
import { useTranslation } from 'react-i18next';

import { useEntityName } from '@/hooks/use_entity_name';
import { getEntityIcon } from '@/utils/entity';

export interface ShareSelectAlertItem {
  stats: EntityInfoStats;
  /** already-translated map display name */
  mapName: string;
}

const Row = ({ stats, mapName }: ShareSelectAlertItem) => {
  const { t } = useTranslation();
  const { name } = useEntityName(stats);
  const iconSrc = getEntityIcon(stats.category, stats.entityInfo.pic);
  return (
    <li className="flex items-center justify-center gap-2">
      <div className="w-6 h-6 shrink-0 rounded-full bg-black/5 flex items-center justify-center">
        {iconSrc && <img src={iconSrc} alt={name} className="w-full h-full object-contain" />}
      </div>
      <span className="text-[#2a2728] font-medium">{name}</span>
      <span className="text-[#6a6a6a]">·</span>
      <span className="text-[#6a6a6a]">{t('share_link.located_at', { map: mapName })}</span>
    </li>
  );
};

export const ShareSelectAlertContent = ({ title, items }: { title: string; items: ShareSelectAlertItem[] }) => {
  return (
    <div className={cn('text-base text-[#2a2728] text-center')}>
      <div className="mb-3">{title}</div>
      <ul className="flex flex-col gap-2 max-h-60 overflow-y-auto scrollbar-hide">
        {items.map((item) => (
          <Row key={item.stats.uniqueKey} {...item} />
        ))}
      </ul>
    </div>
  );
};
