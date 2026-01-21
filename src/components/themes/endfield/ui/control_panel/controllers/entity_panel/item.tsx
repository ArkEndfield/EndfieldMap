import { type EntityInfoStats } from '@endfieldmap/map-core';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ButtonWithAudio } from '@/components/common/button_with_audio';
import Counter from '@/components/common/count_up';
import { Tooltip } from '@/components/common/tooltip/tooltip';
import { SoundType } from '@/const/audio_config';
import { useEntityName } from '@/hooks/use_entity_name';
import { useIsMobile } from '@/hooks/use_is_mobile';
import { getEntityIcon } from '@/utils/entity';
import { cn } from '@/utils/style';

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
    const textRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    const { name: displayName } = useEntityName(entity);

    const checkOverflow = React.useCallback(() => {
      const el = textRef.current;
      if (el) {
        setIsOverflowing(el.scrollWidth > el.clientWidth);
      }
    }, []);

    useLayoutEffect(() => {
      checkOverflow();
    }, [displayName, checkOverflow]);

    useEffect(() => {
      const el = textRef.current;
      if (!el) return;

      const observer = new ResizeObserver(checkOverflow);
      observer.observe(el);

      return () => {
        observer.disconnect();
      };
    }, [checkOverflow]);

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
            <div
              ref={textRef}
              className={cn('flex-1 mr-0.5 min-w-0 text-left overflow-hidden', !isOverflowing && 'whitespace-nowrap')}
              style={
                isOverflowing
                  ? {
                      maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                      WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                    }
                  : undefined
              }
            >
              {isOverflowing ? (
                <div className="flex w-fit animate-marquee">
                  <span className="whitespace-nowrap pr-8">{displayName}</span>
                  <span className="whitespace-nowrap pr-8">{displayName}</span>
                </div>
              ) : (
                displayName
              )}
            </div>

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
                    width: `${entity.count.toString().length * 0.7}ch`,
                    height: '1em',
                  }}
                >
                  <span className="absolute left-0 bottom-0 origin-bottom-left" style={{ transform: 'scale(0.7)' }}>
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
