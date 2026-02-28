import { type EntityInfoStats } from '@endfieldmap/map-core';
import { SoundType } from '@endfieldmap/map-web-theme-types/audio';
import { cn } from '@endfieldmap/tools';
import { ButtonWithAudio, useIsMobile } from '@endfieldmap/web-components';
import { observer } from 'mobx-react-lite';
import React, { useMemo } from 'react';

import Counter from '@/components/common/count_up';
import { Tooltip } from '@/components/common/tooltip';
import { useEntityName } from '@/hooks/use_entity_name';
import { getEntityIcon } from '@/utils/entity';

interface EntityItemProps {
  hideCount?: boolean;
  hideMarked?: boolean;
  markCount?: number;
  entity?: EntityInfoStats;
  category?: string;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const EntityItem = observer(
  ({ hideCount = false, entity, category, active = false, onClick, children, hideMarked = false }: EntityItemProps) => {
    const isMobile = useIsMobile();
    const { name: displayName } = useEntityName(entity);

    const progressWidth = useMemo(() => {
      if (entity && entity.count > 0) {
        const percentage = ((entity.markedCount || 0) / entity.count) * 100;
        return `${percentage}%`;
      }
      return '0%';
    }, [entity]);

    const iconSrc = useMemo(() => {
      if (entity && category) {
        return getEntityIcon(category, entity.entityInfo.pic);
      }
      return '';
    }, [entity, category]);

    return (
      <Tooltip
        tooltip={displayName}
        placement="right"
        offset={0}
        disabled={isMobile}
        keepOnHover={false}
        as={ButtonWithAudio}
        asProps={{
          onClick,
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
            active && 'bg-[#fffa00] text-[#4c4c4c]',
            !active && 'hover:bg-[#222222]',
            'border-[0.5px] border-[#898989]/30'
          )}
        >
          <div className="w-6 h-5 flex justify-center items-center shrink-0">
            <div
              className={cn(
                'w-full h-full rounded-full flex items-center justify-center',
                'transition-all duration-200',
                active ? 'bg-black/5' : 'bg-white/5'
              )}
            >
              {children ||
                (iconSrc && <img src={iconSrc} alt={displayName} className="w-full h-full object-contain" />)}
            </div>
          </div>

          <div className="flex flex-1 relative items-center justify-between overflow-hidden">
            <div className="flex-1 mr-0.5 min-w-0 text-left truncate">{displayName}</div>

            {!hideCount && entity && (
              <div
                className={cn(
                  'shrink-0 w-fit grow-0 font-[Outfit] pr-1',
                  'text-center flex items-end justify-center leading-none relative overflow-hidden',
                  active ? 'text-[#707070]' : 'text-[#959595]'
                )}
              >
                {!hideMarked && <Counter value={entity.markedCount || 0} />}
                {!hideMarked && <span className="leading-none">/</span>}
                <span
                  className="leading-none tabular-nums relative inline-block overflow-visible"
                  style={{
                    width: `${entity.count.toString().length * (hideMarked ? 0.9 : 0.7)}ch`,
                    height: '1em',
                  }}
                >
                  <span
                    className="absolute left-0 bottom-0 origin-bottom-left"
                    style={{ transform: hideMarked ? 'none' : 'scale(0.7)' }}
                  >
                    {entity.count}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </Tooltip>
    );
  }
);

export default EntityItem;
