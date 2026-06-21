import { type EntityInfoStats } from '@endfieldmap/map-core';
import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { ButtonWithAudio } from '@endfieldmap/web-components';
import { OperationList } from '@themes/endfield/components/topbar/operation_list';
import { ShareSelectChip } from '@themes/endfield/ui/share_select/chip';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import { useAdapter } from '@/hooks/use_adapter';
import { service } from '@/services';
import { shareSelectStore } from '@/services/share_select_store';
import { urlStateManager } from '@/services/url_state';

interface ChipModel {
  key: string;
  stats: EntityInfoStats;
  isOffMap: boolean;
  dimmed: boolean;
}

export const ShareSelectBar = observer(() => {
  const { adapter } = useAdapter();
  const { t } = useTranslation();

  const dataManager = adapter.entityController.dataManager;
  const currentMapId = service.dataService.mapDataService.mapStateDataService.currentMap.value;

  const findHomeMap = (key: string): string | undefined => {
    for (const [mapId, groups] of dataManager.mapData) {
      if (groups.has(key)) return mapId;
    }
    return undefined;
  };

  const chips: ChipModel[] = [];
  for (const key of shareSelectStore.selectKeys) {
    const onCurrent = dataManager.mapData.get(currentMapId)?.get(key);
    if (onCurrent) {
      chips.push({ key, stats: onCurrent.stats, isOffMap: false, dimmed: !onCurrent.stats.visible });
      continue;
    }
    const homeMapId = findHomeMap(key);
    if (homeMapId) {
      const group = dataManager.mapData.get(homeMapId)?.get(key);
      if (group) chips.push({ key, stats: group.stats, isOffMap: true, dimmed: false });
    }
    // keys on no map (unknown) are skipped
  }

  const handleClick = (chip: ChipModel) => {
    if (chip.isOffMap) {
      const homeMapId = findHomeMap(chip.key);
      if (homeMapId) service.dataService.mapDataService.mapStateDataService.setCurrentMap(homeMapId);
    } else {
      service.dataService.mapDataService.entityDataService.setEntityGroupVisibility(
        currentMapId,
        chip.key,
        !chip.stats.visible
      );
    }
  };

  const handleClose = () => {
    shareSelectStore.close();
    urlStateManager.removeParam('select');
  };

  return (
    <OperationList open={shareSelectStore.visible && chips.length > 0} position="bottom" className="flex gap-1.5">
      {chips.map((chip) => (
        <ShareSelectChip
          key={chip.key}
          stats={chip.stats}
          isOffMap={chip.isOffMap}
          dimmed={chip.dimmed}
          onClick={() => handleClick(chip)}
        />
      ))}
      <ButtonWithAudio
        onClick={handleClose}
        soundType={SoundType.TICK}
        aria-label={t('share_link.close')}
        className="shrink-0 w-6 h-6 rounded-full bg-[#1d1d1d] border-[0.5px] border-[#898989]/30 text-[#cccccc] hover:bg-[#222222] flex items-center justify-center text-xs"
      >
        ✕
      </ButtonWithAudio>
    </OperationList>
  );
});
