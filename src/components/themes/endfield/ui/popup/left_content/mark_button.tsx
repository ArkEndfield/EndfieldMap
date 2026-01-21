import type { DataInstance } from '@endfieldmap/map-core';
import Tooltip from '@themes/endfield/components/tooltip';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { FilterMarked, FilterUnMarked } from '@/components/common/icons';
import { cn } from '@/utils/style';

export interface MarkButtonProps {
  entity: DataInstance;
}

export const MarkButton: React.FC<MarkButtonProps> = observer(({ entity }) => {
  const { t } = useTranslation();
  if (!entity?.markable) return null;
  return (
    <Tooltip
      tooltip={entity.marked ? t('operate.unmark') : t('operate.mark')}
      as={ButtonWithAudio}
      placement="bottom"
      asProps={{
        className: cn('text-xl p-1', entity.marked && 'text-[#fffa00]'),
        onClick: () => entity.toggleMarked?.(),
      }}
    >
      {entity.marked ? <FilterMarked /> : <FilterUnMarked />}
    </Tooltip>
  );
});
