import type { DataInstance } from '@endfieldmap/map-core';
import { useTranslation } from '@endfieldmap/map-service';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, Tooltip, useIsMobile } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';

import { FilterMarked, FilterUnMarked } from '@endfieldmap/web-components';
import { service } from '@/services';

export interface MarkButtonProps {
  entity: DataInstance;
}

export const MarkButton: React.FC<MarkButtonProps> = observer(({ entity }) => {
  const { t } = useTranslation();
  if (!entity?.markable) return null;
  const isMobile = useIsMobile();
  return (
    <Tooltip
      tooltip={ entity.marked ? (t('operate.unmark') + (!isMobile && t('operate.mark_tip'))) : (t('operate.mark') + (!isMobile && t('operate.mark_tip'))) }
      as={ButtonWithAudio}
      placement="bottom"
      asProps={{
        className: cn('text-xl p-1', entity.marked && 'text-[#fffa00]'),
        onClick: () => service.dataService.mapDataService.entityDataService.markEntity(entity.mapId, entity.id, !entity.marked),
      }}
    >
      {entity.marked ? <FilterMarked /> : <FilterUnMarked />}
    </Tooltip>
  );
});
