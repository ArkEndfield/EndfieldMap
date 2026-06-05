import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, useIsMobile } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

import Counter from '@/components/common/count_up';
import { Tooltip } from '@/components/common/tooltip';
import EntityGroup from '@themes/endfield/ui/control_panel/controllers/entity_panel/group';
import { useAdapter } from '@/hooks/use_adapter';

interface AreaStats {
  count: number;
  markedCount: number;
}

export const AreaFilter = observer(() => {
  const { t } = useTranslation(['sidebar', 'lang']);
  const { adapter } = useAdapter();
  const isMobile = useIsMobile();
  const entityController = adapter.entityController;
  const mapDataManager = adapter.mapController.dataManager;
  const mapId = mapDataManager.currentMapId;
  const currentMap = mapDataManager.getMapData(mapId);
  const levelIds: string[] = entityController.getMapLevelIds(mapId);
  const selectedLevelIds = new Set(entityController.getSelectedLevelIds(mapId));
  const areaStats = new Map<string, AreaStats>();

  for (const groupManager of entityController.getMapGroupManagerList(mapId)) {
    for (const instance of groupManager.instances) {
      const levelId = instance.data.mapLevelId;
      if (!levelId) {
        continue;
      }

      const stats = areaStats.get(levelId) ?? { count: 0, markedCount: 0 };
      stats.count += 1;
      if (instance.marked) {
        stats.markedCount += 1;
      }
      areaStats.set(levelId, stats);
    }
  }

  if (levelIds.length <= 1) {
    return null;
  }

  const getLevelDisplayName = (levelId: string): string => {
    const regionId = `${mapId}_${levelId}`;
    const region = currentMap?.regions.find((item) => item.id === regionId || item.id === levelId);

    if (!region) {
      return levelId;
    }

    return t(`lang:${region.name}`, { defaultValue: levelId });
  };

  return (
    <EntityGroup
      title={t('filter.area.title')}
      subtitle="AREA"
      defaultOpen={false}
      iconColor={selectedLevelIds.size === levelIds.length ? '#f9f853' : '#ffffff'}
      totalCount={levelIds.length}
      markedCount={selectedLevelIds.size}
      onIconClick={() => {
        if (selectedLevelIds.size === levelIds.length) {
          entityController.setSelectedLevels(mapId, []);
          return;
        }
        entityController.setSelectedLevels(mapId, levelIds);
      }}
    >
      <div className="space-y-2 py-2">
        <div className="grid grid-cols-2 gap-x-1 gap-y-1.5 px-1">
          {levelIds.map((levelId) => {
            const active = selectedLevelIds.has(levelId);
            const displayName = getLevelDisplayName(levelId);
            const stats = areaStats.get(levelId) ?? { count: 0, markedCount: 0 };
            const progressWidth = stats.count > 0 ? `${(stats.markedCount / stats.count) * 100}%` : '0%';

            return (
              <Tooltip
                key={levelId}
                tooltip={displayName}
                placement="right"
                offset={0}
                disabled={isMobile}
                keepOnHover={false}
                as={ButtonWithAudio}
                asProps={{
                  onClick: () => entityController.setLevelSelected(mapId, levelId, !active),
                  soundType: SoundType.TICK,
                  className: cn(
                    'select-none w-full rounded-full grow overflow-hidden flex items-center',
                    'p-px relative text-xs'
                  ),
                }}
              >
                <div
                  className={cn(
                    'absolute left-0 top-0 h-full',
                    'transition-[width] duration-300 ease-in-out',
                    active ? 'bg-white' : 'bg-[#fffa00]/30'
                  )}
                  style={{ width: progressWidth }}
                />
                <div
                  className={cn(
                    'flex items-center gap-1 p-1 overflow-hidden w-full bg-[#1d1d1d] rounded-full relative z-1 text-[#cccccc]',
                    active && 'text-[#4c4c4c]',
                    !active && 'hover:bg-[#222222]',
                    'border-[0.5px] border-[#898989]/30'
                  )}
                >
                  <div
                    className="absolute inset-0 rounded-full bg-[#fffa00] pointer-events-none"
                    style={{
                      width: active ? '100%' : '0%',
                      transition: 'width 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)',
                    }}
                  />
                  <div className="flex flex-1 relative z-1 items-center justify-between overflow-hidden">
                    <div className="flex-1 ml-3 mr-1 min-w-0 text-left truncate text-[0.9rem] font-bold">{displayName}</div>

                    <div
                      className={cn(
                        'shrink-0 w-fit grow-0 font-[Outfit] pr-1',
                        'text-center flex items-end justify-center leading-none relative overflow-hidden',
                        active ? 'text-[#707070]' : 'text-[#959595]'
                      )}
                    >
                      <Counter value={stats.markedCount} />
                      <span className="leading-none">/</span>
                      <span
                        className="leading-none tabular-nums relative inline-block overflow-visible"
                        style={{
                          width: `${stats.count.toString().length * 0.7}ch`,
                          height: '1em',
                        }}
                      >
                        <span className="absolute left-0 bottom-0 origin-bottom-left" style={{ transform: 'scale(0.7)' }}>
                          {stats.count}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </EntityGroup>
  );
});
