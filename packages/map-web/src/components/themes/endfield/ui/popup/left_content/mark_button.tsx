import type { DataInstance } from '@endfieldmap/map-core';
import Tooltip from '@themes/endfield/components/tooltip';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '@endfieldmap/map-service';

import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { FilterMarked, FilterUnMarked } from '@/components/common/icons';
import { useAdapter } from '@/hooks/use_adapter';
import { cn } from '@/utils/style';

export interface MarkButtonProps {
  entity: DataInstance;
}

export const MarkButton: React.FC<MarkButtonProps> = observer(({ entity }) => {
  const { t } = useTranslation();
  const { mapDataService } = useAdapter();
  if (!entity?.markable) return null;
  return (
    <Tooltip
      tooltip={entity.marked ? t('operate.unmark') : t('operate.mark')}
      as={ButtonWithAudio}
      placement="bottom"
      asProps={{
        className: cn('text-xl p-1', entity.marked && 'text-[#fffa00]'),
        onClick: () => mapDataService.entityDataService.markEntity(entity.mapId, entity.id, !entity.marked),
      }}
    >
      {entity.marked ? <FilterMarked /> : <FilterUnMarked />}
    </Tooltip>
  );
});
