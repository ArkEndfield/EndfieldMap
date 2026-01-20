import { ButtonWithAudio } from '@/components/common/button_with_audio';
import { EditIcon } from '@/components/common/icons';
import type { DataInstance } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import Tooltip from '@themes/endfield/components/tooltip';
import { useTranslation } from 'react-i18next';
import { ElectricPoleKey } from '@endfieldmap/map-core';
import { alert } from '@/components/common/alert/alert_api';

export interface RenameButtonProps {
  entity: DataInstance;
}

export const RenameButton: React.FC<RenameButtonProps> = observer(({ entity }) => {
  const { t } = useTranslation(['popup', 'common']);
  const hasRename = !!entity?.renameable;
  if (!hasRename) return null;
  const entityInfo = entity.entityInfo;

  const isElectricPole = entityInfo?.category === ElectricPoleKey;

  const handleRename = async () => {
    const currentName = entity.name;
    const content = isElectricPole ? t('popup:electric_pole.rename_tip') : t('popup:custom_point.rename_tip');

    const newName = await alert.prompt({
      content,
      defaultValue: currentName,
    });

    if (newName && newName !== currentName) {
      entity.rename(newName);
    }
  };

  return (
    <Tooltip
      tooltip={t('common:operate.rename')}
      as={ButtonWithAudio}
      placement="bottom"
      asProps={{
        className: 'text-xl p-1',
        onClick: handleRename,
      }}
    >
      <EditIcon />
    </Tooltip>
  );
});
