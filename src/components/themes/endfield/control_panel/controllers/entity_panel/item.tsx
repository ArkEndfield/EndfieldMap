import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { EntityInfoItemData } from '@endfieldmap/map-core/types/entity';
import { Tooltip } from '@/components/common/endfield_components/tooltip';
import { getEntityIcon } from '@/utils/entity';
import { cn } from '@/utils/style';
import { observer } from 'mobx-react-lite';

interface EntityItemProps {
  hideCount?: boolean;
  markCount?: number;
  entity?: EntityInfoItemData;
  category?: string;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const EntityItem = observer(
  ({ hideCount = false, entity, category, active = false, onClick, children }: EntityItemProps) => {
    const { t } = useTranslation();

    const displayName = useMemo(() => {
      if (entity) {
        if (entity.entityDataIdKey === 'electric_pole') {
          return t('custom_point.electric_pole' as never);
        }
        return t(`entities.${entity.entityDataIdKey}` as never, { defaultValue: entity.entityInfo.point });
      }
      return '未命名';
    }, [entity, t]);

    const markCount = useMemo(() => {
      if (entity) {
        return entity.markedCount;
      }
      return 0;
    }, [entity]);

    const progressWidth = useMemo(() => {
      if (entity && entity.count > 0) {
        const percentage = (markCount / entity.count) * 100;
        return `${percentage}%`;
      }
      return '0%';
    }, [entity, markCount]);

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
        offset={-4}
        keepOnHover={false}
        as="button"
        asProps={{
          onClick,
          className: cn(
            'flex items-center relative px-[0.3em] py-[0.5em] relative overflow-hidden select-none cursor-pointer',
            'before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
            'before:w-0 before:h-[2px] before:bg-[#343434] before:z-0 before:transition-all',
            active && 'before:w-[0.6em] before:bg-[#fdfb55]',
            'filter-[drop-shadow(0_0_0.2em_rgba(0,0,0,0.6))]',
            active && 'filter-[drop-shadow(0_0_0.3em_rgba(253,251,85,0.3))]'
          ),
        }}
      >
        <div className="w-[2.2em] h-[2.2em] relative z-2 flex justify-center items-center shrink-0">
          <div
            className={cn(
              'w-full h-full bg-[#313131] rounded-full flex justify-center items-center p-[0.4em] relative z-2 overflow-hidden',
              'shadow-[0_0_0.2em_rgba(0,0,0,0.3),0_0_0_0.15em_#313131_inset,0_0_0_0.25em_#605f5f_inset]',
              active &&
                'shadow-[0_0_0.2em_rgba(0,0,0,0.3),0_0_0_0.15em_#313131_inset,0_0_0_0.25em_#313131_inset,0_0_0_0.25em_#fdfb55_inset]',
              !active && 'hover:shadow-[0_0_0.2em_rgba(0,0,0,0.3),0_0_0_0.15em_#313131_inset,0_0_0_0.25em_#777_inset]',
              'after:content-[""] after:absolute after:inset-0 after:rounded-full',
              active && 'after:shadow-[inset_0_0_0.5em_rgba(253,251,85,0.5)]'
            )}
          >
            {children ||
              (iconSrc && (
                <img src={iconSrc} alt={String(displayName)} className="w-full h-full rounded-full object-contain" />
              ))}
          </div>

          <div
            className={cn(
              'absolute top-[-3px] bottom-[-3px] left-[-3px] w-[calc(100%+6px)] rounded-full z-1 opacity-0 transition-opacity -translate-x-1/2',
              active && 'opacity-100',
              'before:content-[""] before:absolute before:w-full before:h-full before:rounded-full',
              'before:border before:border-dashed before:border-[rgba(253,251,85,0.3)]',
              'before:border-l-2 before:border-l-[rgba(253,251,85,0.6)]',
              'before:border-r-2 before:border-r-[rgba(253,251,85,0.6)]',
              'after:content-[""] after:absolute after:w-full after:h-full after:rounded-full after:rotate-45',
              'after:border after:border-dashed after:border-[rgba(253,251,85,0.3)]',
              'after:border-t-2 after:border-t-[rgba(253,251,85,0.6)]',
              'after:border-b-2 after:border-b-[rgba(253,251,85,0.6)]'
            )}
          />
        </div>

        <div
          className={cn(
            'bg-[#1d1d1d] relative z-1 -ml-[1em] rounded-r-full grow overflow-hidden',
            'shadow-[0_0_0_0.1em_#242424_inset]',
            active && 'bg-[#252525] shadow-[0_0_0_0.1em_rgba(253,251,85,0.4)_inset]',
            !active && 'hover:bg-[#222222]'
          )}
        >
          <div className="py-[0.3em] pl-[1.2em] pr-[0.4em] flex w-full relative z-3 items-center justify-between overflow-hidden">
            <div
              className={cn(
                'flex-1 text-[0.8em] mr-[0.5em] text-[#cccccc] whitespace-nowrap overflow-hidden text-ellipsis min-w-0 pl-[0.2em]',
                active && 'text-[#fdfb55] [text-shadow:0_0_5px_rgba(253,251,85,0.5)]',
                !active && 'hover:text-[#dddddd]'
              )}
            >
              {displayName}
            </div>

            {!hideCount && entity && (
              <div
                className={cn(
                  'shrink-0 font-medium bg-[#2a2a2a] text-[#aaaaaa] px-[0.05em] py-[0.03em] rounded-full min-w-[1.2em]',
                  'text-center shadow-[0_0_0_1px_#333333] inline-flex items-center justify-center leading-none ml-[0.1em] relative overflow-hidden',
                  active &&
                    'bg-[rgba(253,251,85,0.15)] text-[#fdfb55] shadow-[0_0_0_1px_rgba(253,251,85,0.4)] [text-shadow:0_0_5px_rgba(253,251,85,0.5)]',
                  !active && 'hover:bg-[#333333] hover:text-[#bbbbbb]'
                )}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-[rgba(253,251,85,0.2)] transition-[width] duration-300 ease-in-out"
                  style={{ width: progressWidth }}
                />
                <div className="scale-[0.6] relative z-1">
                  {markCount}/{entity.count}
                </div>
              </div>
            )}
          </div>

          <div
            className={cn(
              'absolute w-[0.5em] h-[0.5em] opacity-0 top-0 right-0',
              'border-t border-r border-transparent transition-all',
              active && 'opacity-100 h-full w-[1em] border-[rgba(253,251,85,0.7)] rounded-tr-full rounded-br-full'
            )}
          />
          <div
            className={cn(
              'absolute w-[0.5em] h-[0.5em] opacity-0 bottom-0 left-[1em]',
              'border-b border-l border-transparent transition-all',
              active && 'opacity-100 w-[0.8em] border-[rgba(253,251,85,0.7)]'
            )}
          />
        </div>
      </Tooltip>
    );
  }
);

export default EntityItem;
